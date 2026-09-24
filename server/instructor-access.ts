import crypto from 'node:crypto';
import {
  INSTRUCTOR_CONTENT_CIPHERTEXT,
  INSTRUCTOR_CONTENT_NONCE,
} from './instructor-payload';

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

export function decryptInstructorContent(): unknown {
  const encodedKey = process.env.INSTRUCTOR_CONTENT_KEY;

  if (!encodedKey) {
    throw new Error('Instructor content key is not configured.');
  }

  const key = Buffer.from(encodedKey, 'base64url');
  if (key.length !== 32) {
    throw new Error('Instructor content key must decode to 32 bytes.');
  }

  const nonce = Buffer.from(INSTRUCTOR_CONTENT_NONCE, 'base64url');
  const packed = Buffer.from(INSTRUCTOR_CONTENT_CIPHERTEXT, 'base64url');

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
