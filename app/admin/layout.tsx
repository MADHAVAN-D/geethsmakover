import type { ReactNode } from 'react';

/**
 * /admin root layout is intentionally empty:
 *  - /admin/login is a standalone screen
 *  - /admin/(shell)/* gets the auth gate + dashboard shell in its own layout
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
