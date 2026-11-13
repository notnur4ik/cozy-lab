import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { writeAuditLog } from '@/lib/security/audit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rate = await checkRateLimit({
    key: `admin:login:${ip}`,
    limit: 5,
    windowSeconds: 300,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Valid email and password are required.' } },
      { status: 422 }
    );
  }

  const emailRate = await checkRateLimit({
    key: `admin:login:email:${parsed.data.email.toLowerCase()}`,
    limit: 5,
    windowSeconds: 300,
  });
  if (!emailRate.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many login attempts for this account.' } },
      { status: 429, headers: { 'Retry-After': String(emailRate.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { code: 'AUTH_NOT_CONFIGURED', message: 'Supabase Auth is not configured.' } },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await writeAuditLog({
      action: 'LOGIN_FAILED',
      entityType: 'auth',
      metadata: { email: parsed.data.email },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  await writeAuditLog({
    actorId: data.user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'auth',
    entityId: data.user.id,
    ipAddress: ip,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ ok: true, userId: data.user.id });
}
