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
  const doc = getDocPage('dev', slug);

  return {
    title: doc ? `${doc.title} | Developer & Build Documentation` : 'Developer & Build Documentation | Rory Skagen Art',
    description: doc?.description || 'Developer documentation, architecture, Fourthwall APIs, and build runbooks for Rory Skagen Art.'
  };
}

export default async function DevDocsPage({ params }: PageProps) {
  const resolved = await params;
  const slug = resolved.slug && resolved.slug.length > 0 ? resolved.slug[0]! : 'overview';
  const doc = getDocPage('dev', slug);

  return (
    <DocsLayout
      currentScope="dev"
      currentSlug={slug}
      doc={doc}
    />
  );
}
