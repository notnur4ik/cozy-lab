import crypto from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkIdempotencyKey,
  computeRequestSignature,
  resetSecurityMemoryStoresForTests,
  storeIdempotencyResult,
  verifyReplayProtection,
} from '@/lib/security/replay';
import { checkRateLimit, resetRateLimitMemoryForTests } from '@/lib/security/rate-limit';
import { validateImageUpload } from '@/lib/security/upload';
import {
  claimWebhookEvent,
  resetWebhookMemoryForTests,
  verifyWhatsAppWebhookSignature,
} from '@/lib/security/webhook';
import { escapeHtml } from '@/lib/security/sanitize';
import { verifySameOrigin } from '@/lib/security/api-helpers';

describe('Security Controls: Replay, Idempotency, Rate Limit, Upload, Webhook, XSS', () => {
  beforeEach(() => {
    resetSecurityMemoryStoresForTests();
    resetRateLimitMemoryForTests();
    resetWebhookMemoryForTests();
  });

  it('rejects expired timestamps and reused nonces', async () => {
    const nowMs = 1_700_000_000_000;
    const expiredTs = String(Math.floor((nowMs - 600_000) / 1000));

    const expiredRes = await verifyReplayProtection(
      {
        method: 'POST',
        path: '/api/booking',
        timestampHeader: expiredTs,
        nonceHeader: 'nonce_1234567890abcdef',
        bodyText: '{}',
      },
      nowMs
    );
    expect(expiredRes.ok).toBe(false);
    expect(expiredRes.code).toBe('REQUEST_EXPIRED');

    const validTs = String(Math.floor(nowMs / 1000));
    const nonce = 'nonce_unique_1234567890';
    const first = await verifyReplayProtection(
      {
        method: 'POST',
        path: '/api/booking',
        timestampHeader: validTs,
        nonceHeader: nonce,
        bodyText: '{}',
      },
      nowMs
    );
    expect(first.ok).toBe(true);

    const replay = await verifyReplayProtection(
      {
        method: 'POST',
        path: '/api/booking',
        timestampHeader: validTs,
        nonceHeader: nonce,
        bodyText: '{}',
      },
      nowMs
    );
    expect(replay.ok).toBe(false);
    expect(replay.code).toBe('NONCE_REUSED');
  });

  it('validates HMAC request binding and detects payload tampering', async () => {
    process.env.REPLAY_HMAC_SECRET = 'test-secret-32-bytes-minimum-123456';
    const nowMs = 1_700_000_000_000;
    const ts = String(Math.floor(nowMs / 1000));
    const nonce = 'nonce_hmac_1234567890';
    const body = JSON.stringify({ branchId: 'b1' });

    const sig = computeRequestSignature({
      secret: process.env.REPLAY_HMAC_SECRET,
      method: 'POST',
      path: '/api/booking',
      timestamp: ts,
      nonce,
      bodyText: body,
    });

    const tampered = await verifyReplayProtection(
      {
        method: 'POST',
        path: '/api/booking',
        timestampHeader: ts,
        nonceHeader: nonce,
        signatureHeader: sig,
        bodyText: JSON.stringify({ branchId: 'b2' }),
        requireSignature: true,
      },
      nowMs
    );
    expect(tampered.ok).toBe(false);
    expect(tampered.code).toBe('INVALID_SIGNATURE');
  });

  it('enforces idempotency key uniqueness and detects mismatched payloads', async () => {
    const key = 'idem-booking-1234567890';
    await storeIdempotencyResult(key, '/api/booking', '{"a":1}', 201, { id: 'appt-1' });

    const retry = await checkIdempotencyKey(key, '/api/booking', '{"a":1}');
    expect(retry.hit).toBe(true);
    expect(retry.conflict).toBeUndefined();
    expect(retry.status).toBe(201);

    const conflict = await checkIdempotencyKey(key, '/api/booking', '{"a":2}');
    expect(conflict.hit).toBe(true);
    expect(conflict.conflict).toBe(true);
  });

  it('enforces rate limiting', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit({ key: 'login:1.2.3.4', limit: 5, windowSeconds: 60 });
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit({ key: 'login:1.2.3.4', limit: 5, windowSeconds: 60 });
    expect(blocked.allowed).toBe(false);
  });

  it('validates image magic bytes and rejects spoofed executables', () => {
    const fakePng = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]); // MZ header
    expect(validateImageUpload(fakePng, 'image/png').ok).toBe(false);

    const realPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const valid = validateImageUpload(realPng, 'image/png');
    expect(valid.ok).toBe(true);
    expect(valid.storageKey).toMatch(/^uploads\/[0-9a-f-]+\.png$/);
  });

  it('verifies WhatsApp webhook signatures and deduplicates events', async () => {
    const secret = 'wa-app-secret';
    const raw = '{"entry":[]}';
    const hmac = crypto.createHmac('sha256', secret).update(raw).digest('hex');

    expect(verifyWhatsAppWebhookSignature(raw, `sha256=${hmac}`, secret)).toBe(true);
    expect(verifyWhatsAppWebhookSignature(raw, 'sha256=deadbeef', secret)).toBe(false);

    const first = await claimWebhookEvent('whatsapp', 'wamid.123:delivered', raw);
    expect(first.alreadyProcessed).toBe(false);
    const second = await claimWebhookEvent('whatsapp', 'wamid.123:delivered', raw);
    expect(second.alreadyProcessed).toBe(true);
  });

  it('escapes HTML to prevent XSS', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('rejects cross-origin CSRF requests and allows same-origin', () => {
    expect(verifySameOrigin('https://evil.example', 'cozylab.kz')).toBe(false);
    expect(verifySameOrigin('https://cozylab.kz', 'cozylab.kz')).toBe(true);
    expect(verifySameOrigin(null, 'cozylab.kz')).toBe(true);
  });
});
