import {
  getIronSession,
  unsealData,
  type IronSession,
  type SessionOptions,
} from 'iron-session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminSecrets } from '@/lib/env';

export type AdminSessionData = {
  user: string | null;
  expiresAt: number | null;
};

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const COOKIE_NAME = 'gm-admin-session';

export function sessionOptions(): SessionOptions {
  const secrets = requireAdminSecrets();
  return {
    password: secrets.sessionSecret,
    cookieName: COOKIE_NAME,
    ttl: Math.floor(SESSION_TTL_MS / 1000),
    cookieOptions: {
      httpOnly: true,
      // Secure in production (HTTPS). Set INSECURE_ADMIN_COOKIES=1 only for
      // local `npm start` over plain HTTP — never on a public server.
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.INSECURE_ADMIN_COOKIES !== '1',
      sameSite: 'lax',
      path: '/',
    },
  };
}

/**
 * Route handlers: pass the outgoing NextResponse so iron-session can write
 * the Set-Cookie header (after session.save()).
 */
export async function getAdminSessionRes(
  req: NextRequest,
  res: NextResponse,
): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(req, res, sessionOptions());
}

/** Read-only session probe (no response to attach cookies to). */
export async function probeAdminSession(
  req: NextRequest,
): Promise<IronSession<AdminSessionData>> {
  const probe = new NextResponse(null);
  return getIronSession<AdminSessionData>(req, probe, sessionOptions());
}

export async function isAuthedSession(
  session: IronSession<AdminSessionData>,
): Promise<boolean> {
  if (!session.user || !session.expiresAt) return false;
  return session.expiresAt > Date.now();
}

/**
 * Server components (e.g. the admin layout gate): verify the signed cookie
 * directly — no response object available there.
 */
export async function currentAdminUser(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const secrets = requireAdminSecrets();
    const data = await unsealData<AdminSessionData>(raw, {
      password: secrets.sessionSecret,
    });
    if (data.user && data.expiresAt && data.expiresAt > Date.now()) {
      return data.user;
    }
    return null;
  } catch (err) {
    console.error('[auth] session check failed:', err);
    return null;
  }
}
