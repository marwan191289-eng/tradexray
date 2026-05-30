import { Router, Request, Response, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { stripeStorage } from "../lib/stripeStorage";
import { stripeService } from "../lib/stripeService";
import { clerkClient } from "@clerk/express";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

function getAppUrl(req: Request): string {
  const domains = process.env.REPLIT_DOMAINS?.split(',') ?? [];
  if (domains[0]) return `https://${domains[0]}`;
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * GET /api/subscriptions/products
 * List Stripe products synced to the DB
 */
router.get("/products", async (req: any, res: Response) => {
  try {
    const products = await stripeStorage.listProducts();
    res.json({ data: products });
  } catch (err: any) {
    req.log?.error({ err }, "listProducts error");
    res.json({ data: [] });
  }
});

/**
 * GET /api/subscriptions/products-with-prices
 * List Stripe products with their active prices
 */
router.get("/products-with-prices", async (req: any, res: Response) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();

    const productsMap = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    req.log?.error({ err }, "listProductsWithPrices error");
    res.json({ data: [] });
  }
});

/**
 * GET /api/subscriptions/plans
 * Static plan definitions (used by frontend for display)
 */
router.get("/plans", async (req: any, res: Response) => {
  try {
    const plans = [
      {
        id: "free",
        name: "Free",
        description: "Get started with basic trading signals",
        price: 0,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Up to 10 signals per month",
          "Basic analytics",
          "Email notifications",
        ],
        maxSignals: 10,
        apiAccess: false,
        advancedAnalytics: false,
        prioritySupport: false,
      },
      {
        id: "pro",
        name: "Professional",
        description: "For serious traders",
        price: 29.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Unlimited signals",
          "Advanced analytics",
          "API access",
          "Custom alerts",
          "Priority support",
        ],
        maxSignals: null,
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customAlerts: true,
      },
      {
        id: "elite",
        name: "Elite",
        description: "For professional traders and institutions",
        price: 99.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Everything in Pro",
          "Dedicated account manager",
          "Custom integrations",
          "Advanced reporting",
          "White-label options",
        ],
        maxSignals: null,
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customAlerts: true,
      },
    ];

    res.json(plans);
  } catch (err: any) {
    req.log?.error({ err }, "getPlans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/subscriptions/me
 * Get current user's active subscription
 */
router.get("/me", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const profile = await stripeStorage.getProfileByUserId(userId);

    if (!profile?.stripeCustomerId) {
      return res.json({ subscription: null });
    }

    const subs = await stripeStorage.getUserSubscriptions(profile.stripeCustomerId);
    res.json({ subscription: subs[0] || null });
  } catch (err: any) {
    req.log?.error({ err }, "getSubscription error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/subscriptions/checkout
 * Create a Stripe Checkout session
 * Body: { priceId: string, couponCode?: string }
 */
router.post("/checkout", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { priceId, couponCode } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }

    const price = await stripeStorage.getPrice(priceId);
    if (!price) {
      return res.status(404).json({ error: "Price not found" });
    }

    let profile = await stripeStorage.getProfileByUserId(userId);

    let stripeCustomerId = profile?.stripeCustomerId;
    if (!stripeCustomerId) {
      const clerkUser = await clerkClient().users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const customer = await stripeService.createCustomer(email, userId);
      stripeCustomerId = customer.id;

      if (profile) {
        await stripeStorage.updateProfileStripeCustomerId(userId, stripeCustomerId);
      }
    }

    const appUrl = getAppUrl(req);
    const session = await stripeService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${appUrl}/subscriptions?checkout=success`,
      `${appUrl}/subscriptions?checkout=cancel`,
      couponCode,
    );

    res.json({ url: session.url });
  } catch (err: any) {
    req.log?.error({ err }, "checkout error");
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/subscriptions/portal
 * Create a Stripe Customer Portal session
 */
router.post("/portal", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const profile = await stripeStorage.getProfileByUserId(userId);

    if (!profile?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found. Subscribe first." });
    }

    const appUrl = getAppUrl(req);
    const session = await stripeService.createCustomerPortalSession(
      profile.stripeCustomerId,
      `${appUrl}/subscriptions`,
    );

    res.json({ url: session.url });
  } catch (err: any) {
    req.log?.error({ err }, "portal error");
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * GET /api/subscriptions/usage/limits
 */
router.get("/usage/limits", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const limits = {
      userId,
      signalsUsed: 45,
      maxSignals: 100,
      apiCallsUsed: 1250,
      maxApiCalls: 10000,
      storageUsedMb: 250,
      maxStorageMb: 1000,
      resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
    res.json(limits);
  } catch (err: any) {
    req.log?.error({ err }, "getUsageLimits error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/subscriptions/payments
 */
router.get("/payments", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const profile = await stripeStorage.getProfileByUserId(userId);

    if (!profile?.stripeCustomerId) {
      return res.json({ payments: [], total: 0, limit: 10, offset: 0 });
    }

    const result = await import('drizzle-orm').then(({ sql }) =>
      import('@workspace/db').then(({ db }) =>
        db.execute(sql`
          SELECT pi.id, pi.amount, pi.currency, pi.status, pi.created,
                 pi.description
          FROM stripe.payment_intents pi
          WHERE pi.customer = ${profile.stripeCustomerId}
            AND pi.status = 'succeeded'
          ORDER BY pi.created DESC
          LIMIT 20
        `)
      )
    );

    const payments = (result.rows as any[]).map((r) => ({
      id: r.id,
      amount: r.amount / 100,
      currency: (r.currency as string).toUpperCase(),
      status: 'completed',
      description: r.description || 'Subscription Payment',
      date: new Date(Number(r.created) * 1000).toISOString(),
    }));

    res.json({ payments, total: payments.length, limit: 20, offset: 0 });
  } catch (err: any) {
    req.log?.error({ err }, "getPayments error");
    res.json({ payments: [], total: 0, limit: 10, offset: 0 });
  }
});

/**
 * POST /api/subscriptions/coupons/apply
 */
router.post("/coupons/apply", requireAuth, async (req: any, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const stripe = await import('../lib/stripeClient').then((m) => m.getUncachableStripeClient());
    const coupon = await stripe.coupons.retrieve(code).catch(() => null);

    if (!coupon || !coupon.valid) {
      return res.status(400).json({ error: "Invalid or expired coupon code" });
    }

    res.json({
      code: coupon.id,
      discountType: coupon.percent_off ? "percentage" : "fixed",
      discountValue: coupon.percent_off ?? (coupon.amount_off ? coupon.amount_off / 100 : 0),
      valid: true,
    });
  } catch (err: any) {
    req.log?.error({ err }, "applyCoupon error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
