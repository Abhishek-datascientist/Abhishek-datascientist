# PocketTracker setup

## Supabase

1. Open the Supabase project and choose **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create household membership, email-bound invite codes, expense creator attribution, and row-level security. This is safe to run after the earlier single-user expense schema.
	Re-run this SQL after app updates that add expense categories or fields; it updates the allowed category list and adds the optional merchant detail column.
3. In **Authentication > Providers**, make sure Email sign-in is enabled. Email confirmation may be enabled; new users then need to confirm their address before signing in.
4. The local project URL and publishable key are read from `.env.local`. That file is ignored by Git. Never put a Supabase `service_role` key in the browser app.

After signing in, create a household or join with an invite code. The creator becomes the household admin. Admins issue a single-use code for a specific email; share the code with that person, who must sign up and accept it using the same email. Every expense records its creator, and the dashboard includes household and per-member totals. Existing expenses in this browser can be explicitly imported into the household after it is created.

## Cloudflare Pages

1. Push this project to a Git repository and import it in Cloudflare Pages.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Pages project's environment variables for production (and preview if needed).
4. Redeploy after setting the variables. Keep `.env.local` out of Git.