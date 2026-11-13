# Administrator CRM User Guide — COZY LAB

## Accessing the CRM

Navigate to `/admin/login` and sign in with your staff email and password.

## Roles & Permissions

- **OWNER:** Full access across all branches, financial analytics, staff, services, branches, and audit logs.
- **MANAGER:** Branch-scoped access to analytics, staff, services, and appointments.
- **ADMINISTRATOR:** Appointment management, client management, and payment recording (limited financial analytics).
- **MASTER:** View own schedule and own assigned appointments.

## Daily Workflow

1. **Dashboard (`/admin/dashboard`):** Monitor today's appointments, new requests, confirmations, cancellations, and revenue.
2. **Appointments (`/admin/appointments`):**
   - Confirm `NEW` / `PENDING` requests.
   - Mark `COMPLETED` after service delivery, or `NO_SHOW` / `CANCELLED` if applicable.
   - All status changes are logged with timestamp, actor, and reason.
3. **Services & Masters (`/admin/services`, `/admin/masters`):**
   - Update real prices (`is_price_verified`) and master profiles.
   - Archive discontinued services rather than deleting historical records.
4. **Notifications (`/admin/settings`):** Review new booking, cancellation, and rescheduling requests and mark them as read.
