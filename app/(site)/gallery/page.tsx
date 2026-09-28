import type { Metadata } from 'next';
import { getGallery } from '@/lib/content';
import GalleryGrid from '@/components/site/GalleryGrid';
import SectionHeading from '@/components/site/SectionHeading';
import Reveal from '@/components/site/Reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Bridal, engagement and occasion work by Geeths Makeover — airbrush HD bridal looks, styling and more, done at home-service appointments.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <div className="page-container py-12 md:py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Gallery"
          title="Work from recent seasons"
          description="Tap any photo to view it full size. Real looks, real light, real celebrations."
        />
      </Reveal>
      <GalleryGrid items={items} />
    </div>
  );
}
