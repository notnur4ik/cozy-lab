import { NextRequest, NextResponse } from 'next/server';
import { createBookingSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createBooking } from '@/server/services/booking-service';
import {
  apiErrorResponse,
  storeIdempotencyResult,
  validateReplayAndIdempotency,
} from '@/lib/security/api-helpers';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rate = await checkRateLimit({
    key: `booking:create:${ip}`,
    limit: 15,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many booking requests. Please try again later.' } },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const gate = await validateReplayAndIdempotency(request, '/api/booking', {
    requireIdempotencyKey: true,
  });
  if (!gate.ok) return gate.response;

  const parsed = createBookingSchema.safeParse(gate.ctx.jsonBody);
  if (!parsed.success) {
    return apiErrorResponse(422, 'VALIDATION_ERROR', 'Invalid booking data.', parsed.error.flatten());
  }

  const result = await createBooking({
    ...parsed.data,
    source: 'ONLINE',
    ipAddress: ip,
    userAgent: request.headers.get('user-agent'),
  });

  const responsePayload = result.ok
    ? { booking: result.booking }
    : { error: { code: result.code, message: result.message } };

  if (gate.ctx.idempotencyKey) {
    await storeIdempotencyResult(
      gate.ctx.idempotencyKey,
      '/api/booking',
      gate.ctx.bodyText,
      result.status,
      responsePayload
    );
  }

  return NextResponse.json(responsePayload, { status: result.status });
}
