import { NextRequest, NextResponse } from 'next/server';
import { whatsappInquirySchema } from '@/lib/validation/schemas';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { getPublicEnv } from '@/lib/env';
import { buildOfficialWhatsAppUrl, recordWhatsAppInquiry } from '@/server/services/whatsapp-service';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = whatsappInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid WhatsApp inquiry payload.' } },
      { status: 422 }
    );
  }

  const admin = createSupabaseAdminClient();
  let branchWhatsAppPhone = getPublicEnv().whatsappFallbackPhone;

  if (admin) {
    const { data: branch } = await admin
      .from('branches')
      .select('whatsapp_phone, phone')
      .eq('id', parsed.data.branchId)
      .maybeSingle();
    if (branch?.whatsapp_phone || branch?.phone) {
      branchWhatsAppPhone = branch.whatsapp_phone || branch.phone || branchWhatsAppPhone;
    }
  }

  if (!branchWhatsAppPhone) {
    return NextResponse.json(
      {
        error: {
          code: 'WHATSAPP_PHONE_NOT_CONFIGURED',
          message: 'Branch WhatsApp phone number is not configured.',
        },
      },
      { status: 503 }
    );
  }

  const record = await recordWhatsAppInquiry(parsed.data);
  const whatsappUrl = buildOfficialWhatsAppUrl(branchWhatsAppPhone, parsed.data.messageText);

  return NextResponse.json({
    inquiryId: record.id,
    deliveryStatus: record.deliveryStatus,
    whatsappUrl,
  });
}
