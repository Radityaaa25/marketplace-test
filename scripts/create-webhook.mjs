import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";

const secretKey = process.env.STRIPE_SECRET_KEY;
const args = process.argv.slice(2);
const replace = args.includes("--replace");
const saveLocal = args.includes("--save-local");
const cliUrl = args.find((argument) => !argument.startsWith("--"));
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
      if (!endpoint.url) {
        return false;
      }
      const normalizedEndpointUrl = endpoint.url
        .replace(/([^:]\/)\/+/g, "$1")
        .replace(/\/api\/stripe\/webhook$/, "")
        .replace(/\/+$/, "");
      return normalizedEndpointUrl === webhookUrl;
    },
  );

  if (matching) {
    if (replace) {
      console.log(`Replacing existing endpoint ${matching.id}.`);
      await stripe.webhookEndpoints.del(matching.id);
    } else {
      console.log("A matching Stripe webhook endpoint already exists:");
      console.log(`URL: ${matching.url}`);
      console.log(`Webhook ID: ${matching.id}`);
      console.log("Use --replace to delete this URL's endpoint and create a new one.");
      process.exit(0);
    }
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
  if (saveLocal && endpoint.secret) {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const existingEnv = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf8")
      : "";
    const line = `STRIPE_WEBHOOK_SECRET=${endpoint.secret}`;
    const updatedEnv = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(existingEnv)
      ? existingEnv.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, line)
      : `${existingEnv}${existingEnv.endsWith("\n") || existingEnv.length === 0 ? "" : "\n"}${line}\n`;
    fs.writeFileSync(envPath, updatedEnv, "utf8");
    console.log("Signing secret saved to the gitignored .env.local file.");
  } else {
    console.log("Signing secret: shown only once by Stripe.");
    console.log("Set endpoint.secret as STRIPE_WEBHOOK_SECRET locally and in Vercel.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";
  if (message.includes("maximum of 16 test webhook endpoints")) {
    console.error("Stripe Sandbox already has 16 webhook endpoints.");
    console.error("No endpoint for this app was found, so one existing unused test endpoint must be deleted.");
    console.error("Open Stripe Dashboard -> Developers -> Webhooks, delete only an endpoint you or the candidate no longer uses, then run this command again.");
    process.exit(1);
  }
  console.error(`Could not create webhook: ${message}`);
  process.exit(1);
}
