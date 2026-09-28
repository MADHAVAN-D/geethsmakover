import type { Metadata } from 'next';
import ServiceManager from '@/components/admin/ServiceManager';

export const metadata: Metadata = { title: 'Services' };

export default function AdminServicesPage() {
  return <ServiceManager />;
}
