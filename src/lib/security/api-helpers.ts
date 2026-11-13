import { NextRequest, NextResponse } from 'next/server';
import {
  checkIdempotencyKey,
  storeIdempotencyResult,
  verifyReplayProtection,
} from '@/lib/security/replay';
import { AuthorizationError } from '@/lib/security/rbac';

export function apiErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status }
  );
}

export function verifySameOrigin(
  originHeader: string | null,
  hostHeader: string | null
): boolean {
  if (!originHeader) return true; // Non-browser / same-origin server call without Origin
  if (!hostHeader) return false;
  try {
    const parsedOrigin = new URL(originHeader);
    return parsedOrigin.host === hostHeader;
  } catch {
    return false;
  }
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthorizationError) {
    return apiErrorResponse(err.status, err.code, err.message);
  }
  return apiErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error.');
}

export interface ReplayIdempotencyContext {
  bodyText: string;
  jsonBody: unknown;
  idempotencyKey: string | null;
}

/**
 * Validates replay headers, optional idempotency key, and JSON body parsing.
 * Returns either a NextResponse (short-circuit) or the parsed request context.
 */
export async function validateReplayAndIdempotency(
  request: NextRequest,
  endpointPath: string,
  options: { requireIdempotencyKey?: boolean } = {}
): Promise<
  | { ok: true; ctx: ReplayIdempotencyContext }
  | { ok: false; response: NextResponse }
> {
  const bodyText = await request.text();

  const replay = await verifyReplayProtection({
    method: request.method,
    path: endpointPath,
    timestampHeader: request.headers.get('x-request-timestamp'),
    nonceHeader: request.headers.get('x-request-nonce'),
    signatureHeader: request.headers.get('x-request-signature'),
    bodyText,
  });

  if (!replay.ok) {
    return {
      ok: false,
      response: apiErrorResponse(
        replay.status ?? 400,
        replay.code ?? 'REPLAY_REJECTED',
        replay.message ?? 'Replay check failed.'
      ),
    };
  }

  const idempotencyKey = request.headers.get('idempotency-key');
  if (options.requireIdempotencyKey) {
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return {
        ok: false,
        response: apiErrorResponse(
          400,
          'IDEMPOTENCY_KEY_REQUIRED',
          'Valid Idempotency-Key header is required.'
        ),
      };
    }
  }

  if (idempotencyKey) {
    const idem = await checkIdempotencyKey(idempotencyKey, endpointPath, bodyText);
    if (idem.hit) {
      if (idem.conflict) {
        return {
          ok: false,
          response: apiErrorResponse(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Idempotency-Key already used with a different request payload.'
          ),
        };
      }
      return {
        ok: false,
        response: NextResponse.json(idem.body, { status: idem.status ?? 200 }),
      };
    }
  }

  let jsonBody: unknown;
  try {
    jsonBody = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return {
      ok: false,
      response: apiErrorResponse(400, 'INVALID_JSON', 'Malformed JSON body.'),
    };
  }

  return {
    ok: true,
    ctx: { bodyText, jsonBody, idempotencyKey },
  };
}

export { storeIdempotencyResult };
