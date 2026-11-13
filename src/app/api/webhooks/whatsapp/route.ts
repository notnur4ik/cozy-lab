import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { claimWebhookEvent, verifyWhatsAppWebhookSignature } from '@/lib/security/webhook';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const { whatsappWebhookVerifyToken } = getServerEnv();
  if (mode === 'subscribe' && whatsappWebhookVerifyToken && token === whatsappWebhookVerifyToken) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Meta WhatsApp Cloud API Webhook Events (POST)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const { whatsappAppSecret } = getServerEnv();

  if (!verifyWhatsAppWebhookSignature(rawBody, signature, whatsappAppSecret)) {
    return NextResponse.json({ error: { code: 'INVALID_SIGNATURE' } }, { status: 401 });
  }

  let payload: {
    entry?: Array<{
      id?: string;
      changes?: Array<{
        value?: {
          statuses?: Array<{ id?: string; status?: string; timestamp?: string }>;
        };
      }>;
    }>;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const statusObj of change.value?.statuses ?? []) {
        if (!statusObj.id || !statusObj.status) continue;
        const eventId = `${statusObj.id}:${statusObj.status}`;
        const { alreadyProcessed } = await claimWebhookEvent('whatsapp', eventId, rawBody);
        if (alreadyProcessed) continue;

        if (admin) {
          await admin
            .from('whatsapp_inquiries')
            .update({ delivery_status: statusObj.status.toUpperCase() })
            .eq('provider_message_id', statusObj.id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
