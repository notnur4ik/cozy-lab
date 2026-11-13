# Backup & Recovery Procedure — COZY LAB

## 1. Automated Backups

- **Daily Automated Snapshots:** Enable Supabase Point-in-Time Recovery (PITR) or daily scheduled `pg_dump` backups encrypted at rest.
- **Retention Policy:**
  - Daily backups retained for **30 days**.
  - Weekly backups retained for **90 days**.
  - Monthly archive snapshots retained for **12 months**.

## 2. Manual Encrypted Backup Command

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="cozy_lab_$(date +%Y%m%d).dump"
```

## 3. Restoration Procedure

1. Provision a clean staging/recovery PostgreSQL instance.
2. Restore the dump:
   ```bash
   pg_restore --dbname="$RECOVERY_DATABASE_URL" --clean --if-exists cozy_lab_YYYYMMDD.dump
   ```
3. Verify row counts on `appointments`, `payments`, `clients`, and `audit_logs`.
4. Verify the `no_overlapping_master_appointments` constraint is active.

## 4. Periodic Restoration Testing

Run a full restoration drill to a staging database **at least once per quarter** and record the recovery time objective (RTO) and verification result.
