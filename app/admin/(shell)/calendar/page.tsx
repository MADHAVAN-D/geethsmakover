import type { Metadata } from 'next';
import AdminCalendar from '@/components/admin/AdminCalendar';

export const metadata: Metadata = { title: 'Calendar' };

export default function AdminCalendarPage() {
  return <AdminCalendar />;
}
