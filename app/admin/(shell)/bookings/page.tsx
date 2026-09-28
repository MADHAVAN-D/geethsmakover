import type { Metadata } from 'next';
import BookingsList from '@/components/admin/BookingsList';

export const metadata: Metadata = { title: 'Bookings' };

export default function AdminBookingsPage() {
  return <BookingsList />;
}
