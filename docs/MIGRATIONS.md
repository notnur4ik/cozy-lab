# Database Migration Instructions — COZY LAB

## Migration Files

Located in `supabase/migrations/`:

1. `0001_initial_schema.sql` — Extensions (`pgcrypto`, `btree_gist`), enums, tables, indexes, and the `no_overlapping_master_appointments` GIST exclusion constraint.
2. `0002_rls_and_functions.sql` — Row Level Security (RLS) policies, branch isolation helpers, `create_booking_atomic(...)`, and `transition_appointment_status(...)`.

## Applying Migrations

### Option A: Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B: Supabase SQL Editor

1. Open Supabase Dashboard → **SQL Editor**.
2. Run `supabase/migrations/0001_initial_schema.sql`.
3. Run `supabase/migrations/0002_rls_and_functions.sql`.

## Development Seed Data

`supabase/seed/demo_seed.sql` contains **demo/placeholder records only** (unverified branch addresses, placeholder master profiles, unverified service prices).

Run it **only in development/staging** environments—never treat demo seed records as verified production business data.
