import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

try {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  if (endpoints.data.length === 0) {
    console.log("No webhook endpoints found.");
  }
  for (const endpoint of endpoints.data) {
    console.log(`${endpoint.id} | ${endpoint.url} | ${endpoint.status}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";
  console.error(`Could not list webhook endpoints: ${message}`);
  process.exit(1);
}
