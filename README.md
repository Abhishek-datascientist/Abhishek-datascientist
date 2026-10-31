# PocketTracker

PocketTracker is a mobile-friendly household finance tracker built with React, Vite, and Capacitor. It lets you record expenses, earnings, investment activity, and loan repayments, review month-by-month summaries, and share a ledger with a household. When Supabase is configured, data is stored in the cloud and protected by row-level security. Without Supabase configuration, the app runs in local-only mode and saves expenses and finance records in the current browser or WebView.

## Features

- Track and edit expenses by merchant, date, and amount.
- Add household earnings, including salary and other income.
- Record investment activity and loan repayments in the Savings module.
- Track each loan's lender, original amount, EMI, due day, and first EMI month; record monthly EMI payments and see due/paid status and payment history.
- View a month-by-month home summary for earnings, expenses, and savings activity.
- Filter transaction history by month, module, category, member, and search terms.
- Create a household or join one with an invite code.
- Let household admins record earnings, expenses, and savings activity for a selected member, with the recorder and beneficiary kept distinct.
- Sign in with an email/password, email one-time code, or phone one-time code.
- Link a verified email and phone number to the same Supabase account.
- Import expenses previously saved locally after signing in.
- Package the web app as an Android app using Capacitor.

## Requirements

- Node.js and npm.
- A Supabase project for cloud sync and OTP sign-in.
- Android Studio, an Android SDK, and a compatible JDK to build and run the Android app.
- An Android device or emulator for device testing.

## Local development

Install the dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Vite prints the local URL to open in a browser. The app can also be previewed as a production build:

```sh
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project and copy its project URL and **publishable** key.
2. Create a `.env.local` file in the repository root:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   Do not put a Supabase `service_role` key in this file or in the app. A key prefixed with `VITE_` is included in the client bundle; only use the project's publishable key here.

3. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor to create the household and expense tables, policies, and functions.
4. In the Supabase dashboard, enable email/password, email OTP, and phone authentication as needed. For production, configure a trusted SMTP provider for email and an SMS provider for phone OTPs. Configure email/SMS templates to deliver the numeric `{{ .Token }}` code required by the app.
5. Review Auth rate limits, OTP expiry, CAPTCHA protection, and the relevant SMS sender registration and regulations for your users' countries. SMS delivery may incur provider charges.
6. Test both OTP methods and household creation/invitations before using real data.

Existing users can continue with their email and password or choose an email code for the same email account. Password reset is available from the password sign-in screen. New accounts can use email/password, email OTP, or phone OTP. After signing in, use **Sign-in methods** to verify and link another contact method to the existing account. Do not create a second account for a contact you want to link; separate Supabase user IDs do not automatically merge or transfer transactions.

Phone numbers must include their international country code in E.164 form, for example `+919876543210`.

Household invitations are email-based. A phone-first account must link and verify its email before accepting an invitation addressed to that email.

The **Loans & EMIs** module tracks monthly scheduled EMIs and the payments recorded against them. It does not calculate outstanding loan principal or interest, live investment valuations, or automatic bank payments. Household admins can record items for a selected member; records store both the member they are for and the account that entered them. Existing expense history is preserved when the schema is updated.

Official setup guides:

- [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase phone OTP and SMS providers](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)

## Android app

The Capacitor Android project is already present in `android/`. Build the web assets and sync them into the native project:

```sh
npm run android:sync
```

Open the project in Android Studio:

```sh
npm run android:open
```

In Android Studio, select an emulator or connected Android device and run the app. Confirm Supabase OTP delivery, household flows, and expense persistence on a real device before distributing it.

For a Play Store release, set the final app name, icon, and version; generate a signed Android App Bundle (`.aab`) in Android Studio; and test that release bundle. A Google Play Console developer account, store listing, privacy/data declarations, and any required testing track are the app owner's responsibility. Keep the signing key and provider credentials private and backed up.

Official mobile/release guides:

- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Android publishing](https://developer.android.com/studio/publish)
- [Google Play app setup](https://support.google.com/googleplay/android-developer/answer/9859152)

## Cloudflare Pages

The web app can be hosted on Cloudflare Pages. Use `npm run build` as the build command and `dist` as the output directory. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Pages build environment variables, run the latest [`supabase/schema.sql`](./supabase/schema.sql), and add the deployed domain to Supabase Auth's allowed URLs. Complete the production OTP, household-role, and data-persistence checks in [`SETUP.md`](./SETUP.md) before entering real financial data.

## Development, SIT, and production

Use `dev`, `sit`, and the existing `pocket-tracker` branch for production. Keep three separate Supabase projects (and preferably three Cloudflare Pages projects) so test accounts and data cannot mix with production. The existing Supabase project that contains real transactions should be designated production; back it up before applying any future database changes. Do not create three divergent copies of the SQL schema. Keep one ordered migration history, validate each database change in dev, promote it to SIT, then production. See [`SETUP.md`](./SETUP.md) for initial environment setup and the migration-history caveat for the project already configured through the SQL Editor.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the web app into `dist/` |
| `npm run preview` | Preview the production web build |
| `npm run android:sync` | Build the app and sync web assets/plugins to Android |
| `npm run android:open` | Open the Android project in Android Studio |

## Project layout

- `src/` — React UI, expense tracker, and authentication.
- `supabase/schema.sql` — database schema, access policies, and household functions.
- `android/` — Capacitor Android project.
- `capacitor.config.json` — Capacitor app identifier, display name, and web asset directory.
