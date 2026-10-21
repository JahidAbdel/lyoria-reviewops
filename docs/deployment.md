# Deployment notes

Deploy the repository root as one Next.js application in a fresh Vercel project. The fictional public demo works without an account; the saved workspace and live analysis use Supabase and Nebius.

## Required Vercel variables

Configure all seven values for Production, Preview and Development:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEBIUS_API_KEY=
NEBIUS_MODEL=nvidia/nemotron-3-super-120b-a12b
NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1
LYORIA_DEMO_ACCESS_CODE=
```

Keep `SUPABASE_SECRET_KEY`, `NEBIUS_API_KEY` and `LYORIA_DEMO_ACCESS_CODE` server-only. Never place them in Git, screenshots, the video or a variable prefixed with `NEXT_PUBLIC_`.

## Passwordless email

Verify the sending domain in Resend, create a sending-only API key for that domain, then configure Supabase Auth custom SMTP with:

- Sender: `auth@<deployment-domain>`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: the Resend API key

Use this link in both the **Confirm sign up** and **Magic link or OTP** templates so the server can create a session without relying on the browser that requested the email:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/workspace">Open Lyoria</a>
```

Disable provider-side email link tracking because rewritten authentication links may fail verification.
After the owner account has been confirmed, disable new user sign-ups in Supabase Auth. The client also sends `shouldCreateUser: false`, but the provider setting prevents direct API sign-ups that bypass the interface.

## Before deployment

1. Set a hard spending limit with the inference provider.
2. Run `pnpm test`, `pnpm typecheck`, `pnpm build` and `pnpm audit --audit-level=high`.
3. Create the Vercel project and add the seven variables above.
4. Deploy, then set the Supabase Site URL to `https://<deployment-domain>` and allow `https://<deployment-domain>/auth/callback` as a redirect URL.
5. Verify the prepared demo, passwordless login, a fictional live analysis, an incorrect access code and mobile layout.
6. Confirm the public deployment does not require a Vercel account login.

The two-call concurrency limit applies per server instance. Supabase also enforces a shared quota of two accepted analyses per minute and twenty per UTC day. These controls reduce abuse but do not replace the provider spending limit.
