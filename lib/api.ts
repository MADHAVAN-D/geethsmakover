import { NextResponse, type NextRequest } from 'next/server';
import { isAuthedSession, probeAdminSession } from '@/lib/auth/session';

export function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export type RouteContext = { params: Promise<Record<string, string | string[]>> };

/** Wrap a route handler: consistent 500s, no stack traces leak to clients. */
export function wrap(
  fn: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      console.error('[api] unhandled error:', err);
      const message = err instanceof Error ? err.message : '';
      if (message.startsWith('ADMIN_')) {
        return jsonError(500, 'CONFIG_ERROR', message);
      }
      return jsonError(500, 'SERVER_ERROR', 'Something went wrong. Please try again.');
    }
  };
}

/** Returns null when the request is from a signed-in admin, else a 401/500. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  try {
    const session = await probeAdminSession(req);
    if (await isAuthedSession(session)) return null;
    return jsonError(401, 'UNAUTHENTICATED', 'Your session has ended. Please sign in again.');
  } catch (err) {
    return jsonError(
      500,
      'CONFIG_ERROR',
      err instanceof Error ? err.message : 'Admin authentication is not configured.',
    );
  }
}

export async function readJson<T extends Record<string, unknown>>(
  req: NextRequest,
): Promise<T | null> {
  try {
    const body = (await req.json()) as T;
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}
