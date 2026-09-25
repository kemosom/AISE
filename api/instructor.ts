import { createDecipheriv, timingSafeEqual } from 'node:crypto';
import {
  INSTRUCTOR_CONTENT_CIPHERTEXT,
  INSTRUCTOR_CONTENT_NONCE,
} from '../server/instructor-payload';
import {
  INSTRUCTOR_ALIGNMENT_CIPHERTEXT,
  INSTRUCTOR_ALIGNMENT_NONCE,
} from '../server/instructor-alignment-payload';
import {
  INSTRUCTOR_REPORT_CIPHERTEXT,
  INSTRUCTOR_REPORT_NONCE,
} from '../server/instructor-report-payload';

function normalizeSecret(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validateCode(candidate: unknown, expectedRaw: unknown): boolean {
  const candidateValue = normalizeSecret(candidate);
  const expectedValue = normalizeSecret(expectedRaw);

  if (!candidateValue || !expectedValue) return false;

  const candidateBuffer = Buffer.from(candidateValue, 'utf8');
  const expectedBuffer = Buffer.from(expectedValue, 'utf8');

  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

function decryptPayload(
  encodedKeyRaw: unknown,
  nonceValue: string,
  ciphertextValue: string
): any {
  const encodedKey = normalizeSecret(encodedKeyRaw);
  const key = Buffer.from(encodedKey, 'base64url');

  if (key.length !== 32) {
    throw new Error('invalid_content_key');
  }

  const nonce = Buffer.from(nonceValue, 'base64url');
  const packed = Buffer.from(ciphertextValue, 'base64url');

  if (packed.length <= 16) {
    throw new Error('invalid_payload');
  }

  const ciphertext = packed.subarray(0, packed.length - 16);
  const authTag = packed.subarray(packed.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext);
}

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: Boolean(
        normalizeSecret(process.env.INSTRUCTOR_ADMIN_CODE) &&
        normalizeSecret(process.env.INSTRUCTOR_CONTENT_KEY)
      ),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const adminCode = normalizeSecret(process.env.INSTRUCTOR_ADMIN_CODE);
  const contentKey = normalizeSecret(process.env.INSTRUCTOR_CONTENT_KEY);

  if (!adminCode || !contentKey) {
    return res.status(503).json({
      error: 'Instructor access is not configured for this deployment.',
    });
  }

  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};

  if (!validateCode(body.code, adminCode)) {
    return res.status(401).json({ error: 'Invalid instructor code.' });
  }

  try {
    const base = decryptPayload(
      contentKey,
      INSTRUCTOR_CONTENT_NONCE,
      INSTRUCTOR_CONTENT_CIPHERTEXT
    );

    // Optional addenda should not make the whole instructor area unavailable.
    let alignment = {};
    let reportOverride = {};

    try {
      alignment = decryptPayload(
        contentKey,
        INSTRUCTOR_ALIGNMENT_NONCE,
        INSTRUCTOR_ALIGNMENT_CIPHERTEXT
      );
    } catch (error) {
      console.error('Instructor alignment payload could not be decrypted.', error);
    }

    try {
      reportOverride = decryptPayload(
        contentKey,
        INSTRUCTOR_REPORT_NONCE,
        INSTRUCTOR_REPORT_CIPHERTEXT
      );
    } catch (error) {
      console.error('Instructor report payload could not be decrypted.', error);
    }

    return res.status(200).json({
      ok: true,
      data: {
        ...base,
        ...alignment,
        ...reportOverride,
      },
    });
  } catch (error) {
    console.error('Instructor base payload decryption failed.', error);
    return res.status(500).json({
      error:
        'Instructor material could not be decrypted. Check INSTRUCTOR_CONTENT_KEY.',
    });
  }
}
