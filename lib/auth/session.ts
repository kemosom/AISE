import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dbStore, type UserEntity } from '../db/store';
import type { AuthSession, AuthUserPublic } from './types';

// Built-in resilient fallback for dev mode; Supabase handles tokens in cloud production
const DEFAULT_KEY = 'aise-lab-studio-academic-suite-2026';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createSessionToken(user: UserEntity): string {
  const normalizedRole: 'student' | 'lecturer' | 'admin' =
    user.role.toLowerCase() === 'lecturer'
      ? 'lecturer'
      : user.role.toLowerCase() === 'admin'
      ? 'admin'
      : 'student';

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    studentId: user.studentId,
    role: normalizedRole,
    issuedAt: Date.now(),
  };

  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', DEFAULT_KEY).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): AuthSession | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', DEFAULT_KEY).update(payload).digest('base64url');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const raw = Buffer.from(payload, 'base64url').toString('utf8');
    const session = JSON.parse(raw) as AuthSession;

    // Check expiration
    if (Date.now() - session.issuedAt > SESSION_TTL_MS) {
      return null;
    }

    // Check user in store
    const freshUser = dbStore.getUserById(session.userId);
    if (!freshUser) return null;

    const normalizedRole: 'student' | 'lecturer' | 'admin' =
      freshUser.role.toLowerCase() === 'lecturer'
        ? 'lecturer'
        : freshUser.role.toLowerCase() === 'admin'
        ? 'admin'
        : 'student';

    session.role = normalizedRole;
    return session;
  } catch {
    return null;
  }
}

export function toPublicUser(user: UserEntity): AuthUserPublic {
  const normalizedRole: 'student' | 'lecturer' | 'admin' =
    user.role.toLowerCase() === 'lecturer'
      ? 'lecturer'
      : user.role.toLowerCase() === 'admin'
      ? 'admin'
      : 'student';

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    studentId: user.studentId,
    role: normalizedRole,
  };
}
