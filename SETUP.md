# PocketTracker setup

## Supabase

1. Open the Supabase project and choose **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create household membership, email-bound invite codes, expense creator attribution, and row-level security. This is safe to run after the earlier single-user expense schema and after later app updates.
3. In **Authentication > Sign In / Providers > Email**, enable email sign-in and password sign-in. Email code and password are separate sign-in choices for the same account when the email address matches.
4. In **Authentication > Email Templates**, change the **Magic Link** and **Confirm signup** templates to show `{{ .Token }}` instead of only `{{ .ConfirmationURL }}`. The web and Android clients accept the six-digit code in-app. Keep email confirmation enabled if you want new accounts to verify their email, and configure OTP expiry under **Authentication > Sign In / Providers > Email**.
5. The local project URL and publishable key are read from `.env.local`. That file is ignored by Git. Never put a Supabase `service_role` key in the browser app.

After signing in, create a household or join with an invite code. The creator becomes the household admin. Admins issue a single-use code for a specific email; share the code with that person, who must sign up and accept it using the same email. Admins can enter earnings, expenses, savings activity, loans, and EMI payments for any household member. Each record keeps its beneficiary and the account that entered it. Existing expenses in this browser can be explicitly imported into the household after it is created.

## Android APK

The Capacitor Android project is in `android/`. To build a debug APK, install Android Studio with the Android SDK and JDK 21, then:

1. Run `npm install` and `npm run android:sync` after web changes.
2. Open the native project with `npm run android:open` and let Android Studio install any missing SDK components (the project targets API 36).
3. Choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Find the installable debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` and transfer it to the phone. Android may ask you to allow installs from the file manager/browser.

For a distributable signed release APK, configure a signing key in Android Studio and use **Build > Generate Signed Bundle / APK**. Do not lose the signing key; future updates must use the same app ID and signing identity.

## Cloudflare Pages

1. Push this project to a Git repository and import it in Cloudflare Pages.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Pages project's environment variables for production (and preview if needed).
4. Add the deployed Pages domain to Supabase Authentication's allowed redirect/site URLs, and verify the email and SMS OTP providers, templates, rate limits, and production SMS delivery.
5. Run the latest `supabase/schema.sql` in the Supabase SQL Editor before deploying app changes. It is safe to re-run and updates policies, including restricting expense edits/deletes to the household admin or the member the record belongs to.
6. Redeploy after setting the variables. Keep `.env.local` out of Git. Only the Supabase publishable key belongs in Pages variables; never expose the `service_role` key.
7. Before production use, test sign-in and sign-out, email and phone OTPs, household invitations, admin entry for a second member, regular-member access restrictions, and data persistence on the deployed domain. Use test accounts and sample records, not real financial data.

## Development, SIT, and production

### Isolate the environments

Use three separate Supabase projects, not three PostgreSQL schemas inside one Supabase project. Separate projects isolate Auth users, sessions, storage, RLS policies, and financial data. Keep the existing project that contains real transactions as **production**; never reset or repurpose it for tests. Take and verify a backup before production schema changes.

Keep the existing `pocket-tracker` branch as production and create long-lived `dev` and `sit` branches:

- `dev` is the integration branch and deploys to the dev Supabase/Pages projects.
- `sit` receives tested changes from `dev` and deploys to SIT for acceptance testing.
- `pocket-tracker` receives approved changes from `sit` and deploys to production.

Create one Cloudflare Pages project per environment, connect each to this repository, and set its production branch to the matching branch (`dev`, `sit`, or `pocket-tracker`). Configure each project's own Supabase URL and publishable key; configure its allowed Auth redirect/site URLs on the matching Supabase project. Do not use real customer financial data in dev or SIT. Configure branch protection and require the GitHub Actions build check on pull requests before merging.

The repository includes a build check for pull requests and pushes to these branches. Cloudflare's Git integration can build/deploy each Pages project when its configured branch changes.

### Database schema and migrations

There should be **one source of truth**, not separate hand-maintained dev/SIT/production SQL files. The current [`supabase/schema.sql`](supabase/schema.sql) is a repeatable bootstrap/update script, and it has already been run against the existing project. It does not delete the expense rows, but it changes policies and backfills attribution fields. Treat that existing project as production and do not rerun SQL or test migration changes there without a verified backup and a planned release.

Before automating database deployments, establish Supabase CLI migration history for the already-provisioned production database. The SQL Editor does not create CLI migration history, so do not assume a fresh `supabase db push` is safe against it. Reconcile/baseline the current database with the Supabase CLI, then keep every future database change in a timestamped file under `supabase/migrations/`. Apply the same ordered migrations first to dev, then SIT, and only then production after backup/approval. Never edit an already-applied migration; add a new one. Until the baseline is reviewed, apply schema changes manually to a disposable dev project and keep production database changes manual and backed up.

Useful references:

- [Supabase CLI migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase branching](https://supabase.com/docs/guides/deployment/branching)
- [GitHub Actions](https://docs.github.com/actions)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)