# COZY LAB — Full-Stack Beauty Salon Platform, Online Booking & Multi-Branch CRM

**Designed and developed by NOVEN.CODE**

A production-oriented digital platform for **COZY LAB**, a beauty salon network in Almaty, Kazakhstan.

## Core Capabilities

- **Public Website (`/[locale]`):** Russian (`ru`, default), Kazakh (`kk`), and English (`en`) localized experience with Premium Cozy Minimalism & Editorial Beauty design system (`#F7F3EE`, `#E8DED2`, `#B9A797`, `#51443E`, `#292522`, `#FFFFFF`, Cormorant Garamond + Manrope).
- **Dynamic Catalog & Multi-Branch:** Database-driven service categories, services, masters, gallery, reviews, and arbitrary number of branches.
- **Online Booking Engine (`/api/booking` & `/api/booking/availability`):**
  - Calculates available slots from branch hours, master weekly schedules, breaks, holidays/exceptions, schedule blocks, and active appointments.
  - Prevents double-booking at the PostgreSQL level using `EXCLUDE USING gist` and `create_booking_atomic` row locking.
- **WhatsApp Integration:** Method B prefilled official `wa.me` link + optional WhatsApp Business Cloud API dispatch and signed webhook receiver (`/api/webhooks/whatsapp`).
- **Administrative CRM (`/admin`):** Separate Supabase Auth portal with RBAC (`OWNER`, `MANAGER`, `ADMINISTRATOR`, `MASTER`), branch-level data isolation, appointments, clients, masters, services, branches, payment-based financial analytics, notifications, and immutable audit logs.
- **Cybersecurity Controls:** Replay attack protection (timestamp window + atomic nonce uniqueness + optional HMAC request binding), idempotency keys, rate limiting, magic-byte upload validation, security headers/CSP, and RLS.

## Quick Start

1. Copy `.env.example` to `.env.local` and fill in your Supabase project credentials.
2. Apply database migrations (see [docs/MIGRATIONS.md](docs/MIGRATIONS.md)).
3. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```
4. Run automated checks:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Database Migrations](docs/MIGRATIONS.md)
- [Backup & Recovery](docs/BACKUP_RECOVERY.md)
- [Administrator CRM Guide](docs/ADMIN_GUIDE.md)
