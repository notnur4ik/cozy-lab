import crypto from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { sha256Hex, timingSafeEqualHex } from '@/lib/security/replay';

const processedWebhookMemory = new Set<string>();

/**
 * Verifies Meta / WhatsApp Business Cloud API X-Hub-Signature-256 header.
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;
  if (!signatureHeader.startsWith('sha256=')) return false;

  const providedHex = signatureHeader.slice('sha256='.length).trim();
  const expectedHex = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return timingSafeEqualHex(expectedHex, providedHex);
}

/**
 * Tracks unique provider event IDs so retried webhooks are handled idempotently.
 */
export async function claimWebhookEvent(
  provider: string,
  eventId: string,
  rawBody: string
): Promise<{ alreadyProcessed: boolean }> {
  const payloadHash = sha256Hex(rawBody);
  const admin = createSupabaseAdminClient();

  if (admin) {
    const { error } = await admin.from('webhook_events').insert({
      provider,
      event_id: eventId,
      payload_hash: payloadHash,
    });
    if (error && error.code === '23505') {
      return { alreadyProcessed: true };
    }
    return { alreadyProcessed: false };
  }

  const key = `${provider}:${eventId}`;
  if (processedWebhookMemory.has(key)) {
    return { alreadyProcessed: true };
  }
  processedWebhookMemory.add(key);
  return { alreadyProcessed: false };
}

export function resetWebhookMemoryForTests(): void {
  processedWebhookMemory.clear();
}
