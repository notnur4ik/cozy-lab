import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type { UserRole } from '@/types/domain';

export interface AuditLogInput {
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  branchId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'service_role_key',
  'authorization',
  'cookie',
]);

function sanitizeMetadata(input: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Writes an immutable audit log entry. Never logs secrets or raw credentials.
 */
export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const admin = createSupabaseAdminClient();
  const safeMeta = sanitizeMetadata(entry.metadata);

  if (!admin) {
    return;
  }

  await admin.from('audit_logs').insert({
    actor_id: entry.actorId ?? null,
    actor_role: entry.actorRole ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    branch_id: entry.branchId ?? null,
    metadata: safeMeta,
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
  });
}
