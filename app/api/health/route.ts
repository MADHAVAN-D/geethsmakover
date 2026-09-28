import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
};
