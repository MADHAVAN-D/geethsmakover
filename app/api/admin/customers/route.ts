import { NextResponse } from 'next/server';
import { requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';

/** Admin: list customers. GET /api/admin/customers?q= */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const q = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 80);
  const customers = repo.listCustomers(q || undefined);
  return NextResponse.json({ customers });
});
