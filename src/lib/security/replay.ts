import crypto from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { getServerEnv } from '@/lib/env';

export const REPLAY_WINDOW_SECONDS = 300; // 5 minutes
export const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

export interface ReplayCheckInput {
  method: string;
  path: string;
  timestampHeader: string | null;
  nonceHeader: string | null;
  signatureHeader?: string | null;
  bodyText: string;
  requireSignature?: boolean;
}

export interface ReplayCheckResult {
  ok: boolean;
  status?: number;
  code?: string;
  message?: string;
}

// In-memory store used ONLY in test / non-DB environments
const memoryNonces = new Map<string, number>();
const memoryIdempotency = new Map<
  string,
  { requestHash: string; responseStatus: number; responseBody: unknown; expiresAt: number }
>();

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function computeRequestSignature(params: {
  secret: string;
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  bodyText: string;
}): string {
  const payload = [
    params.method.toUpperCase(),
    params.path,
    params.timestamp,
    params.nonce,
    sha256Hex(params.bodyText),
  ].join('\n');

  return crypto.createHmac('sha256', params.secret).update(payload, 'utf8').digest('hex');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Validates timestamp window, request binding signature (when configured/required),
 * and atomic nonce uniqueness to prevent replay attacks.
 */
export async function verifyReplayProtection(
  input: ReplayCheckInput,
  nowMs: number = Date.now()
): Promise<ReplayCheckResult> {
  if (!input.timestampHeader || !input.nonceHeader) {
    return {
      ok: false,
      status: 400,
      code: 'REPLAY_HEADERS_MISSING',
      message: 'Missing X-Request-Timestamp or X-Request-Nonce header.',
    };
  }

  const tsNum = Number(input.timestampHeader);
  if (!Number.isFinite(tsNum) || tsNum <= 0) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_TIMESTAMP',
      message: 'Invalid request timestamp.',
    };
  }

  // Support both epoch seconds and epoch milliseconds
  const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
  const deltaSeconds = Math.abs(nowMs - tsMs) / 1000;
  if (deltaSeconds > REPLAY_WINDOW_SECONDS) {
    return {
      ok: false,
      status: 401,
      code: 'REQUEST_EXPIRED',
      message: 'Request timestamp is outside the allowed validity window.',
    };
  }

  const nonce = input.nonceHeader.trim();
  if (nonce.length < 16 || nonce.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(nonce)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_NONCE',
      message: 'Nonce must be 16-128 alphanumeric/URL-safe characters.',
    };
  }

  const { replayHmacSecret } = getServerEnv();
  if (input.requireSignature || (replayHmacSecret && input.signatureHeader)) {
    if (!replayHmacSecret) {
      return {
        ok: false,
        status: 500,
        code: 'SECURITY_CONFIG_MISSING',
        message: 'Server replay signature secret is not configured.',
      };
    }
    if (!input.signatureHeader) {
      return {
        ok: false,
        status: 401,
        code: 'SIGNATURE_MISSING',
        message: 'Missing X-Request-Signature header.',
      };
    }
    const expected = computeRequestSignature({
      secret: replayHmacSecret,
      method: input.method,
      path: input.path,
      timestamp: input.timestampHeader,
      nonce,
      bodyText: input.bodyText,
    });
    if (!timingSafeEqualHex(expected, input.signatureHeader.trim())) {
      return {
        ok: false,
        status: 401,
        code: 'INVALID_SIGNATURE',
        message: 'Request signature verification failed.',
      };
    }
  }

  const expiresAtIso = new Date(nowMs + REPLAY_WINDOW_SECONDS * 1000).toISOString();
  const admin = createSupabaseAdminClient();

  if (admin) {
    // Clean expired nonces opportunistically
    await admin.from('security_nonces').delete().lt('expires_at', new Date(nowMs).toISOString());

    const { error } = await admin.from('security_nonces').insert({
      nonce,
      method: input.method.toUpperCase(),
      path: input.path,
      expires_at: expiresAtIso,
    });

    if (error) {
      if (error.code === '23505') {
        return {
          ok: false,
          status: 409,
          code: 'NONCE_REUSED',
          message: 'Replay detected: nonce has already been used.',
        };
      }
      return {
        ok: false,
        status: 500,
        code: 'NONCE_STORE_ERROR',
        message: 'Failed to persist security nonce.',
      };
    }
    return { ok: true };
  }

  // Fallback for test / local non-DB mode
  for (const [k, exp] of memoryNonces.entries()) {
    if (exp < nowMs) memoryNonces.delete(k);
  }
  if (memoryNonces.has(nonce)) {
    return {
      ok: false,
      status: 409,
      code: 'NONCE_REUSED',
      message: 'Replay detected: nonce has already been used.',
    };
  }
  memoryNonces.set(nonce, nowMs + REPLAY_WINDOW_SECONDS * 1000);
  return { ok: true };
}

export interface IdempotencyLookupResult {
  hit: boolean;
  conflict?: boolean;
  status?: number;
  body?: unknown;
}

export async function checkIdempotencyKey(
  key: string,
  endpoint: string,
  bodyText: string,
  nowMs: number = Date.now()
): Promise<IdempotencyLookupResult> {
  const requestHash = sha256Hex(`${endpoint}:${bodyText}`);
  const admin = createSupabaseAdminClient();

  if (admin) {
    const { data } = await admin
      .from('idempotency_keys')
      .select('request_hash, response_status, response_body, expires_at')
      .eq('key', key)
      .maybeSingle();

    if (!data) return { hit: false };
    if (new Date(data.expires_at).getTime() < nowMs) {
      await admin.from('idempotency_keys').delete().eq('key', key);
      return { hit: false };
    }
    if (data.request_hash !== requestHash) {
      return { hit: true, conflict: true };
    }
    return { hit: true, status: data.response_status, body: data.response_body };
  }

  const existing = memoryIdempotency.get(key);
  if (!existing) return { hit: false };
  if (existing.expiresAt < nowMs) {
    memoryIdempotency.delete(key);
    return { hit: false };
  }
  if (existing.requestHash !== requestHash) {
    return { hit: true, conflict: true };
  }
  return { hit: true, status: existing.responseStatus, body: existing.responseBody };
}

export async function storeIdempotencyResult(
  key: string,
  endpoint: string,
  bodyText: string,
  responseStatus: number,
  responseBody: unknown,
  nowMs: number = Date.now()
): Promise<void> {
  const requestHash = sha256Hex(`${endpoint}:${bodyText}`);
  const expiresAtMs = nowMs + IDEMPOTENCY_TTL_SECONDS * 1000;
  const admin = createSupabaseAdminClient();

  if (admin) {
    await admin.from('idempotency_keys').upsert(
      {
        key,
        endpoint,
        request_hash: requestHash,
        response_status: responseStatus,
        response_body: responseBody,
        expires_at: new Date(expiresAtMs).toISOString(),
      },
      { onConflict: 'key' }
    );
    return;
  }

  memoryIdempotency.set(key, {
    requestHash,
    responseStatus,
    responseBody,
    expiresAt: expiresAtMs,
  });
}

export function resetSecurityMemoryStoresForTests(): void {
  memoryNonces.clear();
  memoryIdempotency.clear();
}
