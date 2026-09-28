import type { Metadata } from 'next';
import AvailabilityEditor from '@/components/admin/AvailabilityEditor';

export const metadata: Metadata = { title: 'Availability' };

export default function AdminAvailabilityPage() {
  return <AvailabilityEditor />;
}
