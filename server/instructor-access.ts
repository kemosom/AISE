import crypto from 'node:crypto';
import {
  INSTRUCTOR_CONTENT_CIPHERTEXT,
  INSTRUCTOR_CONTENT_NONCE,
} from './instructor-payload';
import {
  INSTRUCTOR_ALIGNMENT_CIPHERTEXT,
  INSTRUCTOR_ALIGNMENT_NONCE,
} from './instructor-alignment-payload';
import {
  INSTRUCTOR_REPORT_CIPHERTEXT,
  INSTRUCTOR_REPORT_NONCE,
} from './instructor-report-payload';

export function instructorAccessConfigured(): boolean {
  return Boolean(
    process.env.INSTRUCTOR_ADMIN_CODE &&
    process.env.INSTRUCTOR_CONTENT_KEY
  );
}

export function validateInstructorCode(candidate: unknown): boolean {
  const expected = process.env.INSTRUCTOR_ADMIN_CODE;

  if (!expected || typeof candidate !== 'string') {
    return false;
  }

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

function decryptPayload(
  encodedKey: string,
  nonceValue: string,
  ciphertextValue: string
): any {
  const key = Buffer.from(encodedKey, 'base64url');

  if (key.length !== 32) {
    throw new Error('Instructor content key must decode to 32 bytes.');
  }

  const nonce = Buffer.from(nonceValue, 'base64url');
  const packed = Buffer.from(ciphertextValue, 'base64url');

  if (packed.length <= 16) {
    throw new Error('Instructor content payload is invalid.');
  }

  const ciphertext = packed.subarray(0, packed.length - 16);
  const authTag = packed.subarray(packed.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext);
}

export function decryptInstructorContent(): unknown {
  const encodedKey = process.env.INSTRUCTOR_CONTENT_KEY;

  if (!encodedKey) {
    throw new Error('Instructor content key is not configured.');
  }

  const base = decryptPayload(
    encodedKey,
    INSTRUCTOR_CONTENT_NONCE,
    INSTRUCTOR_CONTENT_CIPHERTEXT
  );

  const alignment = decryptPayload(
    encodedKey,
    INSTRUCTOR_ALIGNMENT_NONCE,
    INSTRUCTOR_ALIGNMENT_CIPHERTEXT
  );

  const reportOverride = decryptPayload(
    encodedKey,
    INSTRUCTOR_REPORT_NONCE,
    INSTRUCTOR_REPORT_CIPHERTEXT
  );

  return {
    ...base,
    ...alignment,
    ...reportOverride,
  };
}
