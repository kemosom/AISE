// Supabase cookie and token middleware helper for session management
import type { Request, Response, NextFunction } from 'express';

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
}

/**
 * Standard session extraction that checks Authorization: Bearer <token>
 * or session cookies (sb-access-token / aise_session).
 */
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (req.cookies) {
    if (req.cookies['sb-access-token']) return req.cookies['sb-access-token'];
    if (req.cookies['aise_session']) return req.cookies['aise_session'];
  }

  return null;
}
