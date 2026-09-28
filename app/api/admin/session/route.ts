import { NextResponse, type NextRequest } from 'next/server';
import { isAuthedSession, probeAdminSession } from '@/lib/auth/session';

/** Lightweight session probe used by the admin shell (401 → redirect to login). */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await probeAdminSession(req);
    if (await isAuthedSession(session)) {
      return NextResponse.json({ ok: true, user: session.user });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, configError: true }, { status: 500 });
  }
}
