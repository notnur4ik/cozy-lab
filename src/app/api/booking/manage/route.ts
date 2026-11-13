import { NextRequest, NextResponse } from 'next/server';
import { bookingSelfServiceSchema } from '@/lib/validation/schemas';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { normalizeKzPhone } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { writeAuditLog } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rate = await checkRateLimit({
    key: `booking:manage:${ip}`,
    limit: 10,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bookingSelfServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request.' } },
      { status: 422 }
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database is not configured.' } },
      { status: 503 }
    );
  }

  const normalizedPhone = normalizeKzPhone(parsed.data.phone);
  const { data: appointment } = await admin
    .from('appointments')
    .select('id, branch_id, booking_code, status, clients!inner(phone)')
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  const clientPhone = (appointment?.clients as unknown as { phone?: string } | null)?.phone;
  if (!appointment || clientPhone !== normalizedPhone) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Booking not found for provided code and phone.' } },
      { status: 404 }
    );
  }

  const nowIso = new Date().toISOString();
  if (parsed.data.action === 'CANCEL_REQUEST') {
    await admin
      .from('appointments')
      .update({ cancel_requested_at: nowIso, cancel_reason: parsed.data.reason ?? null })
      .eq('id', appointment.id);

    await admin.from('notifications').insert({
      branch_id: appointment.branch_id,
      type: 'CANCEL_REQUEST',
      title: `Запрос отмены ${appointment.booking_code}`,
      message: parsed.data.reason || 'Клиент запросил отмену записи.',
      entity_type: 'appointment',
      entity_id: appointment.id,
    });
  } else {
    await admin
      .from('appointments')
      .update({
        reschedule_requested_at: nowIso,
        reschedule_note: parsed.data.preferredDateIso ?? parsed.data.reason ?? null,
      })
      .eq('id', appointment.id);

    await admin.from('notifications').insert({
      branch_id: appointment.branch_id,
      type: 'RESCHEDULE_REQUEST',
      title: `Запрос переноса ${appointment.booking_code}`,
      message: parsed.data.preferredDateIso || parsed.data.reason || 'Клиент запросил перенос.',
      entity_type: 'appointment',
      entity_id: appointment.id,
    });
  }

  await writeAuditLog({
    action: parsed.data.action,
    entityType: 'appointment',
    entityId: appointment.id,
    branchId: appointment.branch_id,
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true, bookingCode: appointment.booking_code });
}
