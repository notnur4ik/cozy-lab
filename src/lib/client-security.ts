/**
 * Browser-safe helper for generating replay-protection & idempotency headers.
 */
export function generateClientNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildReplayHeaders(idempotencyPrefix: string): Record<string, string> {
  const nonce = generateClientNonce();
  return {
    'Content-Type': 'application/json',
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    'X-Request-Nonce': nonce,
    'Idempotency-Key': `${idempotencyPrefix}-${nonce}`,
  };
}

/**
 * Returns YYYY-MM-DD in Asia/Almaty (UTC+5).
 */
export function getAlmatyTodayYmd(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 5 * 3600_000);
  return shifted.toISOString().slice(0, 10);
}
