import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const cliUrl = process.argv[2];
const webhookUrl = (cliUrl ?? process.env.WEBHOOK_URL)?.replace(/\/+$/, "").replace(/\/api\/stripe\/webhook$/, "");

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
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const matching = existing.data.find(
    (endpoint) => {
      const normalizedEndpointUrl = endpoint.url
        ?.replace(/\/+$/, "")
        .replace(/\/api\/stripe\/webhook$/, "");
      return normalizedEndpointUrl === webhookUrl;
    },
  );

  if (matching) {
    console.log("A matching Stripe webhook endpoint already exists:");
    console.log(`URL: ${matching.url}`);
    console.log(`Webhook ID: ${matching.id}`);
    console.log("The signing secret is not available again. Use the secret from its Dashboard creation page or rotate it in Stripe Dashboard.");
    process.exit(0);
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: `${webhookUrl}/api/stripe/webhook`,
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
  if (message.includes("maximum of 16 test webhook endpoints")) {
    console.error("Stripe Sandbox already has 16 webhook endpoints.");
    console.error("Open Stripe Dashboard -> Developers -> Webhooks, delete unused test endpoints, then run this command again.");
    process.exit(1);
  }
  console.error(`Could not create webhook: ${message}`);
  process.exit(1);
}
