import type { ReactNode } from 'react';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import SiteCta from '@/components/site/SiteCta';

/**
 * Chrome for the customer website. Server layout, so the Footer (which
 * reads business settings) never enters a client bundle.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <SiteCta />
    </>
  );
}
