import crypto from 'node:crypto';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ValidatedUpload {
  ok: boolean;
  mime?: 'image/jpeg' | 'image/png' | 'image/webp';
  extension?: 'jpg' | 'png' | 'webp';
  storageKey?: string;
  error?: string;
}

/**
 * Validates file buffer using magic bytes (never trusts client filename/extension).
 */
export function validateImageUpload(buffer: Uint8Array, declaredMime: string): ValidatedUpload {
  if (!ALLOWED_IMAGE_MIMES.has(declaredMime)) {
    return { ok: false, error: 'Unsupported MIME type. Allowed: JPEG, PNG, WebP.' };
  }

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'File size must be between 1 byte and 5 MB.' };
  }

  const detected = detectImageSignature(buffer);
  if (!detected) {
    return { ok: false, error: 'Invalid file signature: content is not a supported image.' };
  }

  if (detected.mime !== declaredMime) {
    return { ok: false, error: 'Declared MIME type does not match file signature.' };
  }

  const randomId = crypto.randomUUID();
  return {
    ok: true,
    mime: detected.mime,
    extension: detected.extension,
    storageKey: `uploads/${randomId}.${detected.extension}`,
  };
}

function detectImageSignature(
  bytes: Uint8Array
): { mime: 'image/jpeg' | 'image/png' | 'image/webp'; extension: 'jpg' | 'png' | 'webp' } | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: 'png' };
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', extension: 'webp' };
  }

  return null;
}
