import { NextResponse, type NextRequest } from 'next/server';
import { getAdminSessionRes } from '@/lib/auth/session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  try {
    const session = await getAdminSessionRes(req, res);
    session.destroy();
  } catch (err) {
    console.error('[admin] logout error:', err);
  }
  return res;
}
