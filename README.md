# Marketplace

A Facebook Marketplace-style app built for a job application test. It supports browsing, search, category filters, listing creation with photo uploads, seller messaging, Stripe Connect seller onboarding, and direct-charge Checkout purchases.

**Live URL:** _Add the public Vercel production URL here_

**Screenshots:** _Add screenshot links here_

## Features

- Responsive newest-first listing grid and list view.
- Category tabs, 350 ms debounced title/description search, loading, empty, and error states.
- Listing creation with photo preview, validation, Supabase photo upload, and redirect to the detail page.
- Listing detail with description, seller email, location, date, SOLD state, and seller messaging.
- Stripe Sandbox seller onboarding and direct-charge Buy Now checkout.
- Stripe webhook order confirmation, paid order records, listing SOLD state, and success-page polling.
- No email provider or custom domain is required.

## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui-style primitives, Supabase Postgres and Storage, Stripe Connect Express, and Stripe Checkout.

## Architecture

```text
Seller -> /sell/connect -> Stripe Express onboarding
         -> account.updated webhook -> sellers table

Buyer -> Listing detail -> Buy Now
      -> Server reads listing and seller
      -> Checkout Session on connected account
      -> Direct charge + 10% application fee
      -> checkout.session.completed Connect webhook
      -> orders paid + listing sold
```

The platform fee is a constant:

```text
PLATFORM_FEE_PERCENT = 10
application_fee_amount = round(price_in_cents * 10 / 100)
```

## Supabase setup

Run SQL files in the Supabase **SQL Editor** of the existing project shared with the Wall app:

1. Run `supabase/marketplace.sql` for Marketplace tables and the `listing-images` bucket.
2. Run `supabase/stripe.sql` for `sellers`, `orders`, listing SOLD columns, and the atomic order-finalization function. Run this latest version even if you previously ran an earlier version of the Stripe SQL.

The scripts are idempotent and do not modify or drop the existing `posts` table or `wall-photos` bucket. `sellers` and `orders` have RLS enabled with no anon policies. `listings` has no anon UPDATE policy, so only the service-role server client can change listing status.

## Optional seed

To add demo listings:

```text
1. Replace the seller email in supabase/stripe-seed.sql.
2. Run the file in Supabase SQL Editor.
3. Onboard that exact lowercase email in /sell/connect.
```

## Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in browser code or public variables. `.env.local` is gitignored. `NEXT_PUBLIC_APP_URL` should be the public production URL on Vercel; local development falls back to the request origin.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Local Stripe webhook forwarding:

```bash
stripe listen --api-key <your stripe secret key> --forward-connect-to localhost:3000/api/stripe/webhook
```

Copy the temporary `whsec_...` printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart Next.js.

Before deploying:

```bash
npm run lint
npm run build
git grep -n "sk_test\|whsec_" -- ':!package-lock.json' || true
```

## Stripe webhook registration script

To safely inspect the shared sandbox endpoints without printing any secret:

```bash
node --env-file=.env.local scripts/list-webhooks.mjs
```

Stripe Sandbox permits a maximum of 16 test webhook endpoints. If that limit is reached and there is no endpoint for your URL, contact the test organizer to remove an unused endpoint or register yours. Do not remove endpoints belonging to other candidates.

You do not need to create a personal Stripe account. The supplied sandbox keys belong to the shared Stripe test account. Do not delete endpoint URLs belonging to other candidate applications unless you are certain they are yours or already unused.

Create a production webhook after deployment:

```bash
node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-PUBLIC-PRODUCTION-DOMAIN.vercel.app/api/stripe/webhook
```

Or set `WEBHOOK_URL` and run:

```bash
node --env-file=.env.local scripts/create-webhook.mjs
```

The script creates a Connect endpoint for `checkout.session.completed` and `account.updated` and prints the signing secret once (or saves it to `.env.local` with `--save-local`). Success-page polling also verifies a pending Checkout Session directly with Stripe using the connected account stored in the order. The webhook remains required for production event delivery and account updates.

## Deploy to GitHub and Vercel

1. Run all SQL files in the existing Supabase project.
2. Create `.env.local` and test Stripe locally with Stripe CLI. Never commit real keys.
3. Push this repository to the existing public GitHub repository:

   ```bash
   git push origin main
   git grep -n "sk_test\|whsec_" -- ':!package-lock.json' || true
   ```

4. Open the existing Vercel project, add all variables under **Settings → Environment Variables**, and deploy production.
5. Copy the public production URL marked by Vercel; do not use a preview URL.
6. Run the webhook script with that URL.
7. Copy the newly printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy production.

## Seller and buyer test flow

1. Open `/sell/connect`.
2. Enter a seller email and complete Stripe Express onboarding using the [Stripe test documentation](https://docs.stripe.com/connect/testing).
3. Create a listing using the exact same email, normalized to lowercase.
4. Verify the detail page shows **Buy Now**.
5. Complete Stripe Checkout using `4242 4242 4242 4242`, a future expiry, any CVC, and any ZIP.
6. Verify the success page reaches **Payment confirmed**.
7. In Supabase, verify the listing is `status = 'sold'` and its matching order is `status = 'paid'`.

## Troubleshooting

- **Webhook returns 400:** Verify `STRIPE_WEBHOOK_SECRET` matches the active listener or production endpoint and the route reads the raw body.
- **Buy Now is absent:** The seller must have `charges_enabled = true`, the email must match case-insensitively, and the listing must be available with a price of at least $0.50.
- **Listing is not marked sold:** Confirm a Connect webhook is registered with `connect: true`, the service role key is server-only and valid, and the webhook secret is correct.
- **No such account:** Verify the server passed `{ stripeAccount: connectedAccountId }` to Checkout. Never use the connected account ID in the browser.
- **Events from other candidates appear:** This shared sandbox is expected. Unknown account IDs and order IDs are ignored and return 200.
- **Listings not saving:** Check public Supabase env variables and the anon INSERT RLS policy.
- **Photo upload fails:** Verify `listing-images` is public and has the insert/read policies.
- **Messages fail:** Ensure `listing_id` references an existing `listings.id`.

## Final submission checklist

- [ ] Public Vercel production URL
- [ ] Public GitHub URL
- [ ] Screenshot: seller onboarding
- [ ] Screenshot: Buy Now in Stripe Checkout
- [ ] Screenshot: paid success page
- [ ] Screenshot: paid order and sold listing in Supabase
- [ ] Optional demo video under 3 minutes

### Reviewer notes draft

I built this Marketplace app with help from AI tools and verified seller onboarding, direct-charge Checkout, and the Stripe webhook flow. The sample listing is [add title] and can be bought by the buyer using Stripe test card 4242 4242 4242 4242; the onboarded seller is [add exact lowercase seller email]. Payments use Stripe Connect direct charges with a 10% application fee, and a successful webhook marks the listing sold.
