import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailableSlotsForDate } from '@/server/services/booking-service';

const querySchema = z.object({
  branchId: z.string().uuid(),
  serviceId: z.string().uuid(),
  employeeId: z.string().optional(),
  dateYmd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    branchId: searchParams.get('branchId'),
    serviceId: searchParams.get('serviceId'),
    employeeId: searchParams.get('employeeId') ?? undefined,
    dateYmd: searchParams.get('dateYmd'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid availability query parameters.' } },
      { status: 400 }
    );
  }

  const result = await getAvailableSlotsForDate(parsed.data);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
