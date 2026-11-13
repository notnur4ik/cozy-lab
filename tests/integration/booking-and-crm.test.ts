import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthGet } from '@/app/api/health/route';
import { POST as bookingPost } from '@/app/api/booking/route';
import { GET as availabilityGet } from '@/app/api/booking/availability/route';
import { PATCH as statusPatch } from '@/app/api/admin/appointments/[id]/status/route';
import { POST as paymentsPost } from '@/app/api/admin/payments/route';
import { GET as webhookGet, POST as webhookPost } from '@/app/api/webhooks/whatsapp/route';
import { resetSecurityMemoryStoresForTests } from '@/lib/security/replay';
import { resetRateLimitMemoryForTests } from '@/lib/security/rate-limit';

describe('API Integration Tests', () => {
  beforeEach(() => {
    resetSecurityMemoryStoresForTests();
    resetRateLimitMemoryForTests();
  });

  it('GET /api/health returns 200 ok', async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.service).toBe('cozy-lab');
  });

  it('GET /api/booking/availability rejects invalid query params with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/booking/availability?branchId=bad');
    const res = await availabilityGet(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/booking rejects missing replay headers and missing idempotency key', async () => {
    const reqNoHeaders = new NextRequest('http://localhost:3000/api/booking', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res1 = await bookingPost(reqNoHeaders);
    expect(res1.status).toBe(400);

    const ts = String(Math.floor(Date.now() / 1000));
    const reqNoIdem = new NextRequest('http://localhost:3000/api/booking', {
      method: 'POST',
      headers: {
        'x-request-timestamp': ts,
        'x-request-nonce': 'integration_nonce_123456',
      },
      body: JSON.stringify({}),
    });
    const res2 = await bookingPost(reqNoIdem);
    expect(res2.status).toBe(400);
  });

  it('PATCH /api/admin/appointments/[id]/status rejects invalid UUID and unauthenticated requests', async () => {
    const badIdReq = new NextRequest('http://localhost:3000/api/admin/appointments/not-a-uuid/status', {
      method: 'PATCH',
    });
    const resBad = await statusPatch(badIdReq, { params: Promise.resolve({ id: 'not-a-uuid' }) });
    expect(resBad.status).toBe(400);

    const unauthReq = new NextRequest(
      'http://localhost:3000/api/admin/appointments/11111111-1111-4111-8111-111111111101/status',
      { method: 'PATCH' }
    );
    const resUnauth = await statusPatch(unauthReq, {
      params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111101' }),
    });
    expect(resUnauth.status).toBe(401);
  });

  it('POST /api/admin/payments rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/payments', { method: 'POST' });
    const res = await paymentsPost(req);
    expect(res.status).toBe(401);
  });

  it('WhatsApp webhook rejects invalid verify token and invalid signature', async () => {
    const getReq = new NextRequest(
      'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123'
    );
    const getRes = await webhookGet(getReq);
    expect(getRes.status).toBe(403);

    const postReq = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: { 'x-hub-signature-256': 'sha256=deadbeef' },
      body: '{"entry":[]}',
    });
    const postRes = await webhookPost(postReq);
    expect(postRes.status).toBe(401);
  });
});
