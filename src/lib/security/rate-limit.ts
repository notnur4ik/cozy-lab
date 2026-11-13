import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const memoryBuckets = new Map<string, { count: number; windowStartMs: number }>();

export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
  nowMs?: number;
}): Promise<RateLimitResult> {
  const nowMs = params.nowMs ?? Date.now();
  const windowMs = params.windowSeconds * 1000;
  const admin = createSupabaseAdminClient();

  if (admin) {
    const { data: existing } = await admin
      .from('rate_limit_buckets')
      .select('count, window_starts_at')
      .eq('bucket_key', params.key)
      .maybeSingle();

    if (!existing) {
      await admin.from('rate_limit_buckets').insert({
        bucket_key: params.key,
        count: 1,
        window_starts_at: new Date(nowMs).toISOString(),
      });
      return { allowed: true, remaining: params.limit - 1, retryAfterSeconds: 0 };
    }

    const startMs = new Date(existing.window_starts_at).getTime();
    if (nowMs - startMs >= windowMs) {
      await admin
        .from('rate_limit_buckets')
        .update({ count: 1, window_starts_at: new Date(nowMs).toISOString() })
        .eq('bucket_key', params.key);
      return { allowed: true, remaining: params.limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= params.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((startMs + windowMs - nowMs) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    const nextCount = existing.count + 1;
    await admin
      .from('rate_limit_buckets')
      .update({ count: nextCount })
      .eq('bucket_key', params.key);

    return {
      allowed: true,
      remaining: Math.max(0, params.limit - nextCount),
      retryAfterSeconds: 0,
    };
  }

  // Fallback for test / local mode
  const bucket = memoryBuckets.get(params.key);
  if (!bucket || nowMs - bucket.windowStartMs >= windowMs) {
    memoryBuckets.set(params.key, { count: 1, windowStartMs: nowMs });
    return { allowed: true, remaining: params.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= params.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowStartMs + windowMs - nowMs) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - bucket.count),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitMemoryForTests(): void {
  memoryBuckets.clear();
}
