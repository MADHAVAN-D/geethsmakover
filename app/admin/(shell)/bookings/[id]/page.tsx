import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBooking } from '@/lib/db/repositories';
import { customerWaLink } from '@/lib/whatsapp';
import BookingDetail from '@/components/admin/BookingDetail';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Booking' };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) notFound();

  const waLink = customerWaLink(
    booking,
    'Please find your booking details below. We look forward to coming to you!',
  );

  return <BookingDetail booking={booking} waLink={waLink} />;
}
