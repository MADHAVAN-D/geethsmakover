import type { Metadata } from 'next';
import CustomerList from '@/components/admin/CustomerList';

export const metadata: Metadata = { title: 'Customers' };

export default function AdminCustomersPage() {
  return <CustomerList />;
}
