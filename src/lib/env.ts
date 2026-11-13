/**
 * Server & Public Environment Helpers.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY or REPLAY_HMAC_SECRET to client code.
 */

export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const whatsappFallbackPhone = process.env.NEXT_PUBLIC_WHATSAPP_FALLBACK_PHONE ?? '';

  return {
    supabaseUrl,
    supabaseAnonKey,
    siteUrl,
    whatsappFallbackPhone,
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}

export function getServerEnv() {
  const pub = getPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const replayHmacSecret = process.env.REPLAY_HMAC_SECRET ?? '';
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN ?? '';
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  const whatsappAppSecret = process.env.WHATSAPP_APP_SECRET ?? '';
  const whatsappWebhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '';

  return {
    ...pub,
    serviceRoleKey,
    replayHmacSecret,
    whatsappApiToken,
    whatsappPhoneNumberId,
    whatsappAppSecret,
    whatsappWebhookVerifyToken,
    isServiceRoleConfigured: Boolean(pub.supabaseUrl && serviceRoleKey),
    isWhatsAppCloudConfigured: Boolean(whatsappApiToken && whatsappPhoneNumberId),
  };
}
