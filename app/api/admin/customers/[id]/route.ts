import { NextResponse } from 'next/server';
import { jsonError, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { customerWaLink } from '@/lib/whatsapp';

/** Admin: one customer + full booking history. */
export const GET = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) return jsonError(400, 'INVALID_INPUT', 'Invalid customer.');
  const customer = repo.getCustomer(customerId);
  if (!customer) return jsonError(404, 'NOT_FOUND', 'Customer not found.');
  const bookings = repo.listBookingsByCustomer(customerId);
  return NextResponse.json({ customer, bookings });
});
