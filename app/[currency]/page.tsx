import type { Metadata } from 'next';
import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import { Wrapper } from 'components/wrapper';
import { getShop, getShopOgImage } from 'lib/fourthwall';
import { PRODUCT_COLLECTIONS } from 'lib/taxonomy';
import Link from 'next/link';

export function generateStaticParams() {
  return [{ currency: 'USD' }, { currency: 'EUR' }, { currency: 'GBP' }, { currency: 'CAD' }, { currency: 'AUD' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const [ogImageUrl, shop] = await Promise.all([
    getShopOgImage(),
    getShop()
  ]);

  return {
    title: `${shop.name} | Fine Art Originals & Austin Pop Culture`,
    description: '1-of-1 Original Enamel-on-Steel Masterworks ($4,000–$28,000), B2B Corporate Gifting, Metal Lithos & Archival Editions by Austin Legend Rory Skagen.',
    openGraph: {
      type: 'website',
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function HomePage({ params }: { params: Promise<{ currency: string }> }) {
  const currency = (await params).currency;
  const shop = await getShop();

  return (
    <Wrapper currency={currency} shop={shop}>
      {/* Studio Header & Merchandising Strategy Banner */}
      <section className="border-b border-neutral-200 bg-neutral-50/80 px-4 py-8 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  ★ Studio Collection 1: Fine Art Originals ($4k–$28k)
                </span>
                <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-[11px] font-mono text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  One Core Ingredient: Rory Skagen Art
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black dark:text-white leading-[1.1]">
                Austin Pop Art Masterworks & Iconic Editions
              </h1>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Monetizing 35 years of cultural authority, Austin’s global tech rise, and mid-century Americana. Featuring 15 original monumental enamel masterworks for acquisition, alongside specialized B2B corporate suites, HR welcome kits, and archival editions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/${currency}/collections/fine-art-originals`}
                className="rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition shadow-sm"
              >
                Explore 15 Originals ($4k–$28k) →
              </Link>
              <Link
                href="/docs"
                className="rounded-md border border-neutral-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
              >
                Studio Guide
              </Link>
            </div>
          </div>

          {/* Quick Taxonomy Navigation Chips */}
          <div className="mt-8 border-t border-neutral-200/80 pt-6 dark:border-neutral-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Explore By Product Taxonomy & Audience:
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_COLLECTIONS.map((c) => (
                <Link
                  key={c.handle}
                  href={`/${currency}/collections/${c.handle}`}
                  className="group flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-800 hover:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-white transition"
                >
                  <span>{c.shortTitle}</span>
                  {c.badge && (
                    <span className="rounded-full bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300 font-mono">
                      {c.badge.includes('Active') ? 'Active' : c.priceRange}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                href={`/${currency}/collections/all`}
                className="rounded-full border border-neutral-200 bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white transition"
              >
                Complete Archive (137 Works)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Originals Grid */}
      <div className="mx-auto max-w-screen-2xl px-4 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white">
              Featured 1-of-1 Enamel Originals
            </h2>
            <p className="text-xs text-neutral-500">
              Monumental industrial steel plates with certified studio provenance ($4,000 – $28,000)
            </p>
          </div>
          <Link
            href={`/${currency}/collections/fine-art-originals`}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            View All 15 Originals →
          </Link>
        </div>
      </div>

      <ThreeItemGrid currency={currency} />

      <div className="mx-auto max-w-screen-2xl px-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
            More Studio Originals in the Vault
          </h2>
          <span className="text-xs font-mono text-neutral-500">
            Freight Crate Delivery Included
          </span>
        </div>
      </div>

      <Carousel currency={currency} />

      {/* B2B, HR & Corporate Advisory Banner */}
      <section className="mx-auto max-w-screen-2xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-8 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950 sm:p-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Corporate & Organization Advisory
              </span>
              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight text-black dark:text-white sm:text-3xl">
                B2B, HR Welcome Suites, & VIP Event Gifting
              </h3>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                Whether onboarding executive hires to Austin’s tech corridor, preparing VIP speaker boxes for SXSW or Formula 1 hospitality suites, or acquiring landmark corporate headquarters art: our studio provides volume tiering, white-glove crating, and direct artist collaboration.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Custom Branded Welcome Boxes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Event Planner Volume Discounts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Certified Tax & Insurance Appraisals
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Custom Architectural Murals
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-white p-6 shadow-xs border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Dedicated Art Advisory
              </p>
              <h4 className="mt-1 text-lg font-bold text-black dark:text-white">
                Request Corporate Proposal
              </h4>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Connect with our studio manager to arrange a private gallery viewing or discuss custom gifting packages.
              </p>
              <Link
                href="/pages/contact"
                className="mt-4 block rounded-md bg-neutral-900 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition"
              >
                Contact Studio Manager
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </Wrapper>
  );
}
