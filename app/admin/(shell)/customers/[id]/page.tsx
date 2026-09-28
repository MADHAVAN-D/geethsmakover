import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCustomer, listBookingsByCustomer } from '@/lib/db/repositories';
import CustomerDetail from '@/components/admin/CustomerDetail';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Customer' };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = getCustomer(Number(id));
  if (!customer) notFound();
  const bookings = listBookingsByCustomer(customer.id);
  return <CustomerDetail customer={customer} bookings={bookings} />;
}
