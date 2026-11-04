import { createDecipheriv, scryptSync, timingSafeEqual } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { LAB04_ENCRYPTED_PAYLOAD, LAB04_ENCRYPTION_SALT, LAB04_NONCE } from './lab4-encrypted';

function sameCode(value: unknown, expected: string): boolean {
  if (typeof value !== 'string') return false;
  const supplied = Buffer.from(value, 'utf8');
  const required = Buffer.from(expected, 'utf8');
  return supplied.length === required.length && timingSafeEqual(supplied, required);
}

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const expected = process.env.INSTRUCTOR_ADMIN_CODE;
  if (!expected) return res.status(503).json({ error: 'Instructor access is not configured.' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body || {};
  if (!sameCode(body.code, expected)) return res.status(401).json({ error: 'Invalid instructor code.' });
  try {
    const key = scryptSync(expected, Buffer.from(LAB04_ENCRYPTION_SALT, 'base64url'), 32);
    const payload = Buffer.from(LAB04_ENCRYPTED_PAYLOAD, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(LAB04_NONCE, 'base64url'));
    decipher.setAuthTag(payload.subarray(payload.length - 16));
    const plaintext = Buffer.concat([decipher.update(payload.subarray(0, -16)), decipher.final()]);
    return res.status(200).json({ ok: true, data: JSON.parse(gunzipSync(plaintext).toString('utf8')) });
  } catch {
    return res.status(503).json({ error: 'Private Lab 04 material cannot be opened with the configured instructor code.' });
  }
}
