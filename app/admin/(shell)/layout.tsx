import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { currentAdminUser } from '@/lib/auth/server';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

/**
 * Hard server-side gate: no signed-in session → straight to /admin/login.
 * API endpoints under /api/admin are protected independently.
 */
export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const user = await currentAdminUser();
  if (!user) {
    redirect('/admin/login');
  }
  return <AdminShell user={user}>{children}</AdminShell>;
}
