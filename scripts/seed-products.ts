import { getUncachableStripeClient } from '../artifacts/api-server/src/lib/stripeClient';

/**
 * Seed Stripe products and prices for WAR ROOM / TradeXRay AI
 *
 * Run with: npx tsx scripts/seed-products.ts
 *
 * This script is idempotent — safe to run multiple times.
 * Products: Pro Plan ($29.99/mo, $299.88/yr) and Elite Plan ($99.99/mo, $999.88/yr)
 */
async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    console.log('Checking existing products in Stripe...');

    // ── Pro Plan ────────────────────────────────────────────────────────────
    const existingPro = await stripe.products.search({
      query: "name:'Pro Plan' AND active:'true'",
    });

    let proProduct;
    if (existingPro.data.length > 0) {
      proProduct = existingPro.data[0];
      console.log(`Pro Plan already exists: ${proProduct.id}`);
    } else {
      proProduct = await stripe.products.create({
        name: 'Pro Plan',
        description: 'For serious traders — unlimited signals, advanced analytics, API access',
        metadata: { plan: 'pro' },
      });
      console.log(`Created Pro Plan: ${proProduct.id}`);

      await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 2999,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { plan: 'pro', period: 'monthly' },
      });
      console.log('  ✓ Created Pro monthly price: $29.99/mo');

      await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 29988,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { plan: 'pro', period: 'yearly' },
      });
      console.log('  ✓ Created Pro yearly price: $299.88/yr');
    }

    // ── Elite Plan ──────────────────────────────────────────────────────────
    const existingElite = await stripe.products.search({
      query: "name:'Elite Plan' AND active:'true'",
    });

    if (existingElite.data.length > 0) {
      console.log(`Elite Plan already exists: ${existingElite.data[0].id}`);
    } else {
      const eliteProduct = await stripe.products.create({
        name: 'Elite Plan',
        description: 'For institutions & power users — everything in Pro plus dedicated support',
        metadata: { plan: 'elite' },
      });
      console.log(`Created Elite Plan: ${eliteProduct.id}`);

      await stripe.prices.create({
        product: eliteProduct.id,
        unit_amount: 9999,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { plan: 'elite', period: 'monthly' },
      });
      console.log('  ✓ Created Elite monthly price: $99.99/mo');

      await stripe.prices.create({
        product: eliteProduct.id,
        unit_amount: 99988,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { plan: 'elite', period: 'yearly' },
      });
      console.log('  ✓ Created Elite yearly price: $999.88/yr');
    }

    console.log('\n✅ Products and prices are ready in Stripe!');
    console.log('Webhook sync will automatically import them to your database.');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createProducts();
