import { describe, expect, it } from 'vitest';
import {
  buildOfficialWhatsAppUrl,
  buildWhatsAppPrefilledText,
} from '@/server/services/whatsapp-service';
import { createBookingSchema } from '@/lib/validation/schemas';
import { normalizeKzPhone } from '@/lib/security/sanitize';
import { generateBookingCode } from '@/server/services/booking-service';

describe('WhatsApp Integration & Booking Validation', () => {
  it('builds localized WhatsApp prefilled messages and encodes official wa.me URL', () => {
    const ruMsg = buildWhatsAppPrefilledText({
      branchName: 'COZY LAB — Розыбакиева',
      serviceName: 'Маникюр',
      masterName: 'Алия',
      preferredDate: '2026-11-20',
      preferredTime: '14:00',
      customerName: 'Дана',
      locale: 'ru',
    });
    expect(ruMsg).toContain('COZY LAB — Розыбакиева');
    expect(ruMsg).toContain('Маникюр');

    const kkMsg = buildWhatsAppPrefilledText({
      branchName: 'COZY LAB',
      serviceName: 'Маникюр',
      locale: 'kk',
    });
    expect(kkMsg).toContain('Сәлеметсіз бе!');

    const url = buildOfficialWhatsAppUrl('+7 (700) 123-45-67', ruMsg);
    expect(url.startsWith('https://wa.me/77001234567?text=')).toBe(true);
    expect(url).not.toContain(' ');
  });

  it('normalizes Kazakhstan phone formats consistently', () => {
    expect(normalizeKzPhone('8 (701) 123-45-67')).toBe('+77011234567');
    expect(normalizeKzPhone('+7 701 123 45 67')).toBe('+77011234567');
    expect(normalizeKzPhone('7011234567')).toBe('+77011234567');
  });

  it('validates booking payload boundaries with Zod', () => {
    const valid = createBookingSchema.safeParse({
      branchId: '11111111-1111-4111-8111-111111111101',
      serviceId: '33333333-3333-4333-8333-333333333301',
      employeeId: 'ANY',
      startsAtIso: '2026-11-20T09:00:00.000Z',
      customerName: 'Айгерим',
      customerPhone: '+7 701 123 45 67',
      locale: 'ru',
    });
    expect(valid.success).toBe(true);

    const invalidPhone = createBookingSchema.safeParse({
      branchId: '11111111-1111-4111-8111-111111111101',
      serviceId: '33333333-3333-4333-8333-333333333301',
      employeeId: 'ANY',
      startsAtIso: '2026-11-20T09:00:00.000Z',
      customerName: 'Айгерим',
      customerPhone: 'abc',
      locale: 'ru',
    });
    expect(invalidPhone.success).toBe(false);
  });

  it('generates unique COZY LAB booking codes', () => {
    const c1 = generateBookingCode(new Date('2026-11-13T10:00:00Z'));
    const c2 = generateBookingCode(new Date('2026-11-13T10:00:00Z'));
    expect(c1).toMatch(/^CL-20261113-[0-9A-F]{6}$/);
    expect(c1).not.toBe(c2);
  });
});
