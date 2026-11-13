import { getServerEnv } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type { Locale } from '@/types/domain';

export interface WhatsAppMessageParams {
  branchName: string;
  serviceName: string;
  masterName?: string;
  preferredDate?: string;
  preferredTime?: string;
  customerName?: string;
  locale: Locale;
}

export function buildWhatsAppPrefilledText(params: WhatsAppMessageParams): string {
  if (params.locale === 'kk') {
    return [
      'Сәлеметсіз бе! COZY LAB салонына жазылғым келеді:',
      `Филиал: ${params.branchName}`,
      `Қызмет: ${params.serviceName}`,
      params.masterName ? `Шебер: ${params.masterName}` : null,
      params.preferredDate ? `Күні: ${params.preferredDate}` : null,
      params.preferredTime ? `Уақыты: ${params.preferredTime}` : null,
      params.customerName ? `Атым: ${params.customerName}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (params.locale === 'en') {
    return [
      'Hello! I would like to book an appointment at COZY LAB:',
      `Branch: ${params.branchName}`,
      `Service: ${params.serviceName}`,
      params.masterName ? `Master: ${params.masterName}` : null,
      params.preferredDate ? `Preferred date: ${params.preferredDate}` : null,
      params.preferredTime ? `Preferred time: ${params.preferredTime}` : null,
      params.customerName ? `Name: ${params.customerName}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'Здравствуйте! Хочу записаться в COZY LAB:',
    `Филиал: ${params.branchName}`,
    `Услуга: ${params.serviceName}`,
    params.masterName ? `Мастер: ${params.masterName}` : null,
    params.preferredDate ? `Дата: ${params.preferredDate}` : null,
    params.preferredTime ? `Время: ${params.preferredTime}` : null,
    params.customerName ? `Имя: ${params.customerName}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildOfficialWhatsAppUrl(phoneDigits: string, messageText: string): string {
  const cleanDigits = phoneDigits.replace(/\D/g, '');
  const encoded = encodeURIComponent(messageText);
  return `https://wa.me/${cleanDigits}?text=${encoded}`;
}

/**
 * Records a WhatsApp inquiry separately from confirmed calendar appointments.
 * Never blocks calendar slots automatically.
 * If WhatsApp Business Cloud API is configured, optionally dispatches server-side.
 */
export async function recordWhatsAppInquiry(input: {
  branchId: string;
  serviceId?: string;
  employeeId?: string;
  preferredDate?: string;
  preferredTime?: string;
  customerName?: string;
  customerPhone?: string;
  messageText: string;
}): Promise<{ id: string | null; deliveryStatus: string }> {
  const admin = createSupabaseAdminClient();
  const { isWhatsAppCloudConfigured, whatsappApiToken, whatsappPhoneNumberId } = getServerEnv();

  let deliveryStatus = 'LINK_OPENED';
  let providerMessageId: string | null = null;

  if (isWhatsAppCloudConfigured && input.customerPhone) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: input.customerPhone.replace(/\D/g, ''),
            type: 'text',
            text: { body: input.messageText },
          }),
        }
      );

      if (response.ok) {
        const json = (await response.json()) as { messages?: Array<{ id?: string }> };
        providerMessageId = json.messages?.[0]?.id ?? null;
        deliveryStatus = 'API_SENT';
      } else {
        deliveryStatus = 'API_FAILED';
      }
    } catch {
      deliveryStatus = 'API_FAILED';
    }
  }

  if (!admin) {
    return { id: null, deliveryStatus };
  }

  const { data } = await admin
    .from('whatsapp_inquiries')
    .insert({
      branch_id: input.branchId,
      service_id: input.serviceId ?? null,
      employee_id: input.employeeId ?? null,
      preferred_date: input.preferredDate ?? null,
      preferred_time: input.preferredTime ?? null,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      message_text: input.messageText,
      delivery_status: deliveryStatus,
      provider_message_id: providerMessageId,
    })
    .select('id')
    .single();

  return { id: data?.id ?? null, deliveryStatus };
}
