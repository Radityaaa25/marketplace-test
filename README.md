# Marketplace

A responsive local buy-and-sell app built as a job-application project. Browse listings, search by keyword, create a listing with a photo, and message a seller without creating an account.

**Live URL:** _Add the public Vercel production URL here_

**Screenshots:** _Add screenshot links here_

## Features

- Browse newest-first listings in grid or list view, with category filters and debounced title/description search.
- Publish a listing with a validated photo upload, description, price, seller email, and category.
- View listing details and send a message to the seller; messages are stored without exposing the messages table to public reads.
- Responsive layouts, loading skeletons, empty/error states, and a not-found page.

## Stack

Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS, shadcn/ui-style primitives, and Supabase Postgres and Storage. The app is deployable on Vercel and does not require an email provider or custom domain.

## Supabase setup

This app can share your existing Supabase project with the Wall app. It creates only the `listings` and `messages` tables, Marketplace policies/indexes, and the `listing-photos` bucket. It does **not** modify the existing `posts` table or `wall-photos` bucket.

1. Open the **existing** Supabase project used by the Wall app.
2. In the Supabase dashboard, open **SQL Editor**, create a new query, paste in [`supabase/marketplace.sql`](./supabase/marketplace.sql), and run it. The script is idempotent and only creates Marketplace objects; it does not drop or change the Wall objects.
3. Open **Table Editor** and verify that `listings` and `messages` exist. In **Storage**, verify the `listing-photos` bucket exists and is marked **Public**. If the bucket already existed and is private, make it public in Storage settings; the SQL intentionally leaves an existing bucket unchanged.
4. In the project settings, copy the Project URL and the `anon` / publishable key. Do not use a `service_role` key in the browser or in Vercel client-visible variables.

`listings` is publicly readable and insertable via the anon role. `messages` allows anonymous inserts only; public reads are not granted. Listing photos can be read publicly and inserted into the `listing-photos` bucket. No Realtime subscription is used.

## Environment variables

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Keep `.env.local` and all real credentials out of Git. Only the two public Supabase variables are needed. Messages are saved directly to Supabase, with no email service or custom domain required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before publishing a listing, run the Supabase SQL and configure both public Supabase environment variables.

Before deploying, run:

```bash
npm run lint
npm run build
```

## Publish to GitHub

1. Sign in to GitHub and select **New repository**. Choose a repository name such as `marketplace-app`, set visibility to **Public**, and create it **without** adding a README, license, or `.gitignore` (this project already has those files and Git history).
2. From this project folder, add the new repository as `origin` and push the existing `main` branch:

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/marketplace-app.git
   git push -u origin main
   ```

3. Replace `YOUR-USERNAME` with your GitHub username. The public repository URL is `https://github.com/YOUR-USERNAME/marketplace-app`.

## Deploy a new Vercel project

1. Sign in to Vercel and choose **Add New → Project**. Import the public `marketplace-app` GitHub repository. This creates a **new Vercel project**; do not attach the Wall app's existing Vercel project.
2. In the new project's **Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values used locally. Select **Production**, **Preview**, and **Development** as appropriate.
3. Save the variables. If a deployment was already created before adding them, open **Deployments**, choose the latest deployment's menu, and select **Redeploy**. Otherwise, Vercel will deploy from the import automatically.
4. Wait for the production deployment to complete. In the new Vercel project's **Overview** or **Deployments**, open the deployment marked **Production** and copy its domain (for example, `marketplace-app-your-team.vercel.app`). That is the **public production URL**; do not submit a Preview deployment URL.
5. Add the production URL to the Live URL field at the top of this README and verify creating a listing and sending a message against the existing Supabase project.

## Troubleshooting

- **Listings are not saving:** Confirm both Supabase public environment variables are set for the active environment and redeploy after changing them. Check that `marketplace.sql` ran successfully and that the `listings` anon insert policy is present.
- **Photo upload fails:** Verify the bucket is named exactly `listing-photos`, is public, and has the Marketplace public-read and anon-insert policies. The existing `wall-photos` bucket is separate and is not used by this app.
- **Vercel reports missing environment variables:** Add them under the new Vercel project's Settings → Environment Variables for the relevant environment, then redeploy. Never put the service-role key in the app.
- **Search returns nothing:** Search matches listing titles or descriptions, is case-insensitive, and is debounced by 350 ms. Try a shorter keyword or clear the category filter.
- **Messages fail with a foreign-key error:** The `listing_id` must refer to a row in `listings`. Open the listing from the current site and try again; verify its row still exists and that `marketplace.sql` created the `messages_listing_id_fkey` relationship.
## Final submission checklist

- [ ] Public Vercel **production** URL: `________________________________`
- [ ] Public GitHub repository URL: `________________________________`
- [ ] Screenshot — home page with category tabs
- [ ] Screenshot — search results
- [ ] Screenshot — create listing form
- [ ] Screenshot — listing detail
- [ ] Screenshot — Message Seller dialog and success confirmation
- [ ] Optional demo video (under 3 minutes) showing create, search, and message flows

### Reviewer notes draft

I built this Marketplace app with help from AI tools and verified the core create, browse, search, and message flows. It shares my existing Supabase project with my Wall app, while keeping Marketplace data in separate `listings` and `messages` tables and using a separate `listing-photos` storage bucket. Messages are insert-only for anonymous visitors, and email notifications are optional. The live app is deployed at **[add production URL]** and the source is available at **[add public GitHub URL]**.
