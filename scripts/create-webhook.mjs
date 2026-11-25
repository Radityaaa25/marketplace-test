import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const cliUrl = process.argv[2];
const webhookUrl = cliUrl ?? process.env.WEBHOOK_URL;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY.");
  process.exit(1);
}
if (!webhookUrl) {
  console.error("Pass a public webhook URL as the first argument or set WEBHOOK_URL.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

try {
  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    connect: true,
    enabled_events: [
      "checkout.session.completed",
      "account.updated",
    ],
  });

  console.log("Stripe Connect webhook created:");
  console.log(`URL: ${endpoint.url}`);
  console.log(`Webhook ID: ${endpoint.id}`);
  console.log(`Signing secret: ${endpoint.secret}`);
  console.log("Keep this signing secret in STRIPE_WEBHOOK_SECRET; it is shown only once.");
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";
  console.error(`Could not create webhook: ${message}`);
  process.exit(1);
}
