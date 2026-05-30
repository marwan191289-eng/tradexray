import app from "./app";
import { logger } from "./lib/logger";
import { getStripeSync } from "./lib/stripeClient";
import { runMigrations } from "stripe-replit-sync";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set — skipping Stripe initialization');
    return;
  }

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const domains = process.env.REPLIT_DOMAINS?.split(',') ?? [];
    const primaryDomain = domains[0];

    if (primaryDomain) {
      const webhookUrl = `https://${primaryDomain}/api/stripe/webhook`;
      logger.info({ webhookUrl }, 'Registering Stripe webhook...');
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      logger.info({ url: webhookResult?.webhook?.url }, 'Stripe webhook configured');
    }

    stripeSync.syncBackfill()
      .then(() => logger.info('Stripe data sync complete'))
      .catch((err) => logger.error({ err }, 'Stripe data sync error'));
  } catch (error: any) {
    logger.warn({ err: error.message }, 'Stripe initialization skipped (integration not connected?)');
  }
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
