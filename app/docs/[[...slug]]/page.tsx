import { DocsLayout } from 'components/docs/docs-layout';
import { getDocPage } from 'lib/docs-content';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug && resolved.slug.length > 0 ? resolved.slug[0]! : 'overview';
  const doc = getDocPage('public', slug);

  return {
    title: doc ? `${doc.title} | Rory Skagen Documentation` : 'Public Documentation | Rory Skagen Art',
    description: doc?.description || 'Public documentation for Rory Skagen Art Studio and Fine Art Editions.'
  };
}

export default async function PublicDocsPage({ params }: PageProps) {
  const resolved = await params;
  const slug = resolved.slug && resolved.slug.length > 0 ? resolved.slug[0]! : 'overview';
  const doc = getDocPage('public', slug);

  return (
    <DocsLayout
      currentScope="public"
      currentSlug={slug}
      doc={doc}
    />
  );
}
