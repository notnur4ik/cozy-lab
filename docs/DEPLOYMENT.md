# Deployment Guide — COZY LAB

## 1. Prerequisites

- Node.js 20 LTS or 22 LTS
- Supabase project (PostgreSQL 15+)
- Vercel account (or equivalent Node.js hosting with HTTPS/TLS)

## 2. Environment Variables

Configure all variables from `.env.example` in your hosting provider's encrypted secrets manager:

- **Public (`NEXT_PUBLIC_*`):**
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_WHATSAPP_FALLBACK_PHONE` (optional)
- **Server-Only (NEVER prefix with `NEXT_PUBLIC_`):**
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REPLAY_HMAC_SECRET` (64+ random hex characters)
  - `CRON_SECRET`
  - `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (if WhatsApp Business Cloud API is authorized)

## 3. Supabase Storage Setup

1. Create a storage bucket named `cozy-lab-media`.
2. Restrict uploads to authenticated server-side `service_role` calls via `/api/admin/upload` (which enforces 5 MB limit, MIME allowlist, and magic-byte signature checks).

## 4. Pre-Production Checklist

- [ ] Replace all demo/placeholder data (`is_verified_address = false`, `is_price_verified = false`, placeholder photos) with verified COZY LAB data.
- [ ] Create the initial `OWNER` user in Supabase Auth and insert their row into `public.profiles` with `role = 'OWNER'`.
- [ ] Enable MFA in Supabase Auth for `OWNER` and `MANAGER` accounts.
- [ ] Verify `npm run typecheck`, `npm test`, and `npm run build` pass cleanly.
- [ ] Verify HTTPS/TLS and security headers (`next.config.ts`) in production.
