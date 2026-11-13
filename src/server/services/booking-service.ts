import crypto from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { calculateAvailableSlots } from '@/lib/booking/availability';
import { normalizeKzPhone, maskPhoneForLog } from '@/lib/security/sanitize';
import { writeAuditLog } from '@/lib/security/audit';
import type {
  Appointment,
  AppointmentStatus,
  Branch,
  MasterSchedule,
  ScheduleBlock,
  ScheduleException,
} from '@/types/domain';

export interface CreateBookingInput {
  branchId: string;
  serviceId: string;
  employeeId: string; // UUID or 'ANY'
  startsAtIso: string;
  customerName: string;
  customerPhone: string;
  comment?: string;
  source?: 'ONLINE' | 'ADMIN';
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateBookingResult {
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
  booking?: {
    appointmentId: string;
    bookingCode: string;
    employeeId: string;
    startsAt: string;
    endsAt: string;
    appointmentStatus: AppointmentStatus;
  };
}

export function generateBookingCode(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CL-${y}${m}${d}-${rand}`;
}

function toAlmatyDateYmd(date: Date): string {
  const shifted = new Date(date.getTime() + 5 * 3600_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fetches available slots for a given branch, service, optional master, and date (YYYY-MM-DD).
 */
export async function getAvailableSlotsForDate(params: {
  branchId: string;
  serviceId: string;
  employeeId?: string; // undefined or 'ANY' means all eligible masters
  dateYmd: string;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { configured: false, slots: [] };
  }

  const [branchRes, serviceRes, empServicesRes] = await Promise.all([
    admin.from('branches').select('id, working_hours, is_active').eq('id', params.branchId).maybeSingle(),
    admin
      .from('services')
      .select('id, duration_minutes, is_active, archived_at')
      .eq('id', params.serviceId)
      .maybeSingle(),
    admin.from('employee_services').select('employee_id').eq('service_id', params.serviceId),
  ]);

  if (!branchRes.data || !branchRes.data.is_active || !serviceRes.data || !serviceRes.data.is_active) {
    return { configured: true, slots: [] };
  }

  const eligibleIds = (empServicesRes.data ?? []).map((r) => r.employee_id);
  if (eligibleIds.length === 0) {
    return { configured: true, slots: [] };
  }

  let empQuery = admin
    .from('employees')
    .select('id')
    .eq('branch_id', params.branchId)
    .eq('is_active', true)
    .eq('is_master', true)
    .in('id', eligibleIds);

  if (params.employeeId && params.employeeId !== 'ANY') {
    empQuery = empQuery.eq('id', params.employeeId);
  }

  const { data: masters } = await empQuery;
  const masterIds = (masters ?? []).map((m) => m.id);
  if (masterIds.length === 0) {
    return { configured: true, slots: [] };
  }

  const dayStartIso = new Date(`${params.dateYmd}T00:00:00+05:00`).toISOString();
  const dayEndIso = new Date(`${params.dateYmd}T23:59:59+05:00`).toISOString();

  const [schedulesRes, exceptionsRes, blocksRes, apptsRes] = await Promise.all([
    admin.from('schedules').select('*').in('employee_id', masterIds).eq('branch_id', params.branchId),
    admin
      .from('schedule_exceptions')
      .select('*')
      .eq('exception_date', params.dateYmd)
      .or(`branch_id.eq.${params.branchId},employee_id.in.(${masterIds.join(',')})`),
    admin
      .from('schedule_blocks')
      .select('*')
      .in('employee_id', masterIds)
      .lt('starts_at', dayEndIso)
      .gt('ends_at', dayStartIso),
    admin
      .from('appointments')
      .select('employee_id, starts_at, ends_at, status')
      .in('employee_id', masterIds)
      .lt('starts_at', dayEndIso)
      .gt('ends_at', dayStartIso)
      .not('status', 'in', '("CANCELLED","NO_SHOW")'),
  ]);

  const schedules = (schedulesRes.data ?? []) as MasterSchedule[];
  const exceptions = (exceptionsRes.data ?? []) as ScheduleException[];
  const blocks = (blocksRes.data ?? []) as ScheduleBlock[];
  const appointments = (apptsRes.data ?? []) as Array<
    Pick<Appointment, 'starts_at' | 'ends_at' | 'status'> & { employee_id: string }
  >;

  const slots = calculateAvailableSlots({
    dateYmd: params.dateYmd,
    serviceDurationMinutes: serviceRes.data.duration_minutes,
    branch: branchRes.data as Pick<Branch, 'id' | 'working_hours' | 'is_active'>,
    masters: masterIds.map((id) => ({
      employeeId: id,
      schedules: schedules.filter((s) => s.employee_id === id),
      exceptions: exceptions.filter((e) => e.employee_id === id || e.branch_id === params.branchId),
      blocks: blocks.filter((b) => b.employee_id === id),
      appointments: appointments.filter((a) => a.employee_id === id),
    })),
  });

  return { configured: true, slots };
}

/**
 * Server-side booking creation with availability re-verification and DB-level atomic lock.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      code: 'DATABASE_NOT_CONFIGURED',
      message: 'Database connection is not configured.',
    };
  }

  const startsAt = new Date(input.startsAtIso);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_START_TIME',
      message: 'Appointment start time must be in the future.',
    };
  }

  const { data: service } = await admin
    .from('services')
    .select('id, duration_minutes, price_kzt, is_active, archived_at')
    .eq('id', input.serviceId)
    .maybeSingle();

  if (!service || !service.is_active || service.archived_at) {
    return { ok: false, status: 404, code: 'SERVICE_NOT_FOUND', message: 'Service not available.' };
  }

  const { data: branchService } = await admin
    .from('branch_services')
    .select('price_override_kzt, is_active')
    .eq('branch_id', input.branchId)
    .eq('service_id', input.serviceId)
    .maybeSingle();

  if (!branchService || !branchService.is_active) {
    return {
      ok: false,
      status: 400,
      code: 'SERVICE_NOT_IN_BRANCH',
      message: 'Selected service is not available at this branch.',
    };
  }

  const dateYmd = toAlmatyDateYmd(startsAt);
  const { slots } = await getAvailableSlotsForDate({
    branchId: input.branchId,
    serviceId: input.serviceId,
    employeeId: input.employeeId,
    dateYmd,
  });

  const matchingSlot = slots.find(
    (s) => new Date(s.startIso).getTime() === startsAt.getTime()
  );

  if (!matchingSlot) {
    return {
      ok: false,
      status: 409,
      code: 'SLOT_UNAVAILABLE',
      message: 'Selected time slot is no longer available.',
    };
  }

  const resolvedEmployeeId =
    input.employeeId === 'ANY' ? matchingSlot.employeeId : input.employeeId;
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  const normalizedPhone = normalizeKzPhone(input.customerPhone);
  const bookingCode = generateBookingCode();
  const effectivePrice = branchService.price_override_kzt ?? service.price_kzt ?? null;

  const { data, error } = await admin.rpc('create_booking_atomic', {
    p_booking_code: bookingCode,
    p_branch_id: input.branchId,
    p_service_id: input.serviceId,
    p_employee_id: resolvedEmployeeId,
    p_client_name: input.customerName,
    p_client_phone: normalizedPhone,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_price_kzt: effectivePrice,
    p_source: input.source ?? 'ONLINE',
    p_comment: input.comment ?? null,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('no_overlapping_master_appointments') || msg.includes('TIME_BLOCKED')) {
      return {
        ok: false,
        status: 409,
        code: 'CONCURRENT_BOOKING_CONFLICT',
        message: 'This master and time slot was just reserved. Please choose another slot.',
      };
    }
    return {
      ok: false,
      status: 500,
      code: 'BOOKING_CREATE_FAILED',
      message: 'Unable to create booking.',
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  await writeAuditLog({
    action: 'APPOINTMENT_CREATED',
    entityType: 'appointment',
    entityId: row.appointment_id,
    branchId: input.branchId,
    metadata: {
      bookingCode: row.booking_code,
      source: input.source ?? 'ONLINE',
      maskedPhone: maskPhoneForLog(normalizedPhone),
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    ok: true,
    status: 201,
    booking: {
      appointmentId: row.appointment_id,
      bookingCode: row.booking_code,
      employeeId: resolvedEmployeeId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      appointmentStatus: row.status,
    },
  };
}
