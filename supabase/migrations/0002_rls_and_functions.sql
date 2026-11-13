-- ==============================================================================
-- COZY LAB — Row Level Security (RLS) & Atomic Transactional Functions
-- Designed and developed by NOVEN.CODE
-- ==============================================================================

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION auth_user_has_branch(target_branch_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
    AND (
      p.role = 'OWNER'
      OR EXISTS (
        SELECT 1 FROM branch_managers bm
        WHERE bm.profile_id = p.id AND bm.branch_id = target_branch_id
      )
      OR EXISTS (
        SELECT 1 FROM employees e
        WHERE e.profile_id = p.id AND e.branch_id = target_branch_id
      )
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Public read policies for catalog entities
CREATE POLICY public_read_branches ON branches FOR SELECT USING (is_active = true);
CREATE POLICY public_read_categories ON service_categories FOR SELECT USING (is_active = true);
CREATE POLICY public_read_services ON services FOR SELECT USING (is_active = true AND archived_at IS NULL);
CREATE POLICY public_read_branch_services ON branch_services FOR SELECT USING (is_active = true);
CREATE POLICY public_read_employees ON employees FOR SELECT USING (is_active = true AND is_master = true);
CREATE POLICY public_read_employee_services ON employee_services FOR SELECT USING (true);
CREATE POLICY public_read_schedules ON schedules FOR SELECT USING (true);
CREATE POLICY public_read_reviews ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY public_read_gallery ON gallery_items FOR SELECT USING (is_published = true);
CREATE POLICY public_read_translations ON translations FOR SELECT USING (true);
CREATE POLICY public_read_payment_methods ON payment_methods FOR SELECT USING (is_active = true);

-- Staff read policies with branch isolation
CREATE POLICY staff_read_own_profile ON profiles FOR SELECT USING (id = auth.uid() OR auth_user_role() = 'OWNER');

CREATE POLICY staff_read_appointments ON appointments FOR SELECT USING (
  auth_user_role() = 'OWNER'
  OR (auth_user_role() IN ('MANAGER', 'ADMINISTRATOR') AND auth_user_has_branch(branch_id))
  OR (auth_user_role() = 'MASTER' AND EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND e.profile_id = auth.uid()))
);

CREATE POLICY staff_read_payments ON payments FOR SELECT USING (
  auth_user_role() = 'OWNER'
  OR (auth_user_role() = 'MANAGER' AND auth_user_has_branch(branch_id))
);

CREATE POLICY staff_read_audit_logs ON audit_logs FOR SELECT USING (
  auth_user_role() = 'OWNER'
);
-- Note: No INSERT/UPDATE/DELETE policies on audit_logs for authenticated users;
-- only server-side service_role writes audit_logs, ensuring immutability.

-- ------------------------------------------------------------------------------
-- Atomic Booking Creation RPC (prevents race conditions & double-booking)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_booking_code TEXT,
  p_branch_id UUID,
  p_service_id UUID,
  p_employee_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_price_kzt INTEGER,
  p_source booking_source,
  p_comment TEXT DEFAULT NULL
)
RETURNS TABLE (
  appointment_id UUID,
  booking_code TEXT,
  client_id UUID,
  status appointment_status
) AS $$
DECLARE
  v_client_id UUID;
  v_appt_id UUID;
BEGIN
  -- Lock employee row to serialize concurrent booking attempts for this master
  PERFORM id FROM employees
  WHERE id = p_employee_id AND branch_id = p_branch_id AND is_active = true
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MASTER_NOT_AVAILABLE';
  END IF;

  -- Check schedule blocks
  IF EXISTS (
    SELECT 1 FROM schedule_blocks sb
    WHERE sb.employee_id = p_employee_id
      AND tstzrange(sb.starts_at, sb.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')
  ) THEN
    RAISE EXCEPTION 'TIME_BLOCKED';
  END IF;

  -- Upsert client by normalized phone
  INSERT INTO clients (full_name, phone)
  VALUES (p_client_name, p_client_phone)
  ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id INTO v_client_id;

  -- Insert appointment (exclusion constraint also enforces no overlap)
  INSERT INTO appointments (
    booking_code, branch_id, service_id, employee_id, client_id,
    starts_at, ends_at, price_kzt, status, source, comment
  )
  VALUES (
    p_booking_code, p_branch_id, p_service_id, p_employee_id, v_client_id,
    p_starts_at, p_ends_at, p_price_kzt, 'NEW', p_source, p_comment
  )
  RETURNING id INTO v_appt_id;

  -- Record initial status history
  INSERT INTO appointment_status_history (
    appointment_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    v_appt_id, NULL, 'NEW', NULL, 'Created via ' || p_source::TEXT
  );

  -- Create internal notification for branch staff
  INSERT INTO notifications (
    branch_id, type, title, message, entity_type, entity_id
  )
  VALUES (
    p_branch_id,
    'NEW_BOOKING',
    'Новая запись ' || p_booking_code,
    p_client_name || ' (' || p_client_phone || ')',
    'appointment',
    v_appt_id
  );

  RETURN QUERY SELECT v_appt_id, p_booking_code, v_client_id, 'NEW'::appointment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION create_booking_atomic(TEXT, UUID, UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, booking_source, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_booking_atomic(TEXT, UUID, UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, booking_source, TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- Atomic Status Transition RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION transition_appointment_status(
  p_appointment_id UUID,
  p_new_status appointment_status,
  p_changed_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  appointment_id UUID,
  previous_status appointment_status,
  new_status appointment_status
) AS $$
DECLARE
  v_prev appointment_status;
BEGIN
  SELECT status INTO v_prev
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND';
  END IF;

  IF v_prev = p_new_status THEN
    RAISE EXCEPTION 'DUPLICATE_STATUS_TRANSITION';
  END IF;

  UPDATE appointments
  SET status = p_new_status
  WHERE id = p_appointment_id;

  INSERT INTO appointment_status_history (
    appointment_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    p_appointment_id, v_prev, p_new_status, p_changed_by, p_reason
  );

  RETURN QUERY SELECT p_appointment_id, v_prev, p_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION transition_appointment_status(UUID, appointment_status, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION transition_appointment_status(UUID, appointment_status, UUID, TEXT) TO service_role;
