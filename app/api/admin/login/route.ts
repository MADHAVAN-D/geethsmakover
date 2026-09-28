import { NextResponse, type NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { clientIp, rateLimit } from '@/lib/security/rate-limit';
import {
  getAdminSessionRes,
  SESSION_TTL_MS,
} from '@/lib/auth/session';
import { requireAdminSecrets } from '@/lib/env';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function verify(username: string, password: string): boolean {
  let secrets: { username: string; password: string };
  try {
    secrets = requireAdminSecrets();
  } catch (err) {
    console.error('[admin] auth config error:', err instanceof Error ? err.message : err);
    return false;
  }
  const uOk = timingSafeEqual(digest(username), digest(secrets.username));
  const pOk = timingSafeEqual(digest(password), digest(secrets.password));
  return uOk && pOk;
}

/**
 * Admin login. Rate-limited per IP. Creates a signed, httpOnly session cookie
 * (iron-session) — no plain password in cookies, no client-side checks.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Please wait 15 minutes and try again.',
        },
      },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const username =
    body && typeof (body as Record<string, unknown>).username === 'string'
      ? ((body as Record<string, unknown>).username as string).slice(0, 80)
      : '';
  const password =
    body && typeof (body as Record<string, unknown>).password === 'string'
      ? ((body as Record<string, unknown>).password as string).slice(0, 200)
      : '';

  if (!username || !password) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Enter your username and password.' } },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true, user: username });

  if (!verify(username, password)) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect username or password.' } },
      { status: 401 },
    );
  }

  const session = await getAdminSessionRes(req, res);
  session.user = username;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  await session.save();

  return res;
}
