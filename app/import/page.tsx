'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface ArtworkSummary {
  id: string;
  slug: string;
  title: string;
  series: string;
  year: string;
  medium: string;
  dimensions: string;
  priceUSD: number;
  status: string;
  imageUrl: string;
  collections: string[];
  variantCount: number;
}

interface FourthwallState {
  reachable: boolean;
  authenticated: boolean;
  authMode: string;
  platformApiUrl: string;
  shop?: { id: string; name: string; domain: string; status: string };
  productCount?: number;
  collections?: Array<{ slug: string; name: string }>;
  error?: string;
  httpStatus?: number;
  checkedAt: string;
}

interface WritePathStatus {
  supported: boolean;
  reason: string;
  detail: string;
  verifiedAgainst: string;
  verifiedOn: string;
}

const AUTH_MODE_LABEL: Record<string, string> = {
  bearer: 'Bearer token',
  basic: 'Basic auth',
  storefront: 'Storefront token only',
  none: 'Not configured'
};

function SourceTag({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] text-neutral-500">{children}</span>;
}

export default function ImportPage() {
  const [data, setData] = useState<{
    summary?: any;
    artworks?: ArtworkSummary[];
    fourthwall?: FourthwallState;
    writePath?: WritePathStatus;
  }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('All');
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch('/api/import/fourthwall', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoadError(null);
      })
      .catch((err) => {
        console.error('Failed to load import status:', err);
        setLoadError(err?.message || 'Failed to load status');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const artworks = data.artworks || [];
  const seriesOptions = ['All', 'Austin Iconic & Texas Pop', 'Monsters & Kaiju', 'Pop Surrealism & Folklore', 'Atomic Pop & Sci-Fi'];

  const summary = data.summary;
  const fw = data.fourthwall;
  const writePath = data.writePath;

  const filtered = artworks.filter((art) => {
    const matchesSeries = selectedSeries === 'All' || art.series === selectedSeries;
    const matchesSearch =
      search === '' ||
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.medium.toLowerCase().includes(search.toLowerCase()) ||
      art.slug.toLowerCase().includes(search.toLowerCase());
    return matchesSeries && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <img
              src="/android-chrome-192x192.png"
              alt="Rory Skagen Art"
              className="h-12 w-12 rounded-lg border border-neutral-700 bg-neutral-800 object-cover mt-1 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-3">
                <Link href="/USD" className="text-xs uppercase tracking-wider text-emerald-400 hover:underline">
                  ← Return to Storefront
                </Link>
                <span className="text-neutral-600">|</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-300 border border-neutral-700">
                  Internal Tool
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-xs font-mono text-neutral-400">Austin, Texas • Est. 1985</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Rory Skagen Art → Fourthwall Integration
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Source catalogue migrated from <code className="text-neutral-300">roryskagenart/roryskagenart.com</code>.
                Every number below is labelled with where it came from.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                load();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition"
            >
              {refreshing ? 'Refreshing…' : '↻ Re-query Fourthwall'}
            </button>
            <a
              href="/api/import/fourthwall?format=csv"
              download="rory-skagen-fourthwall-catalog.csv"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
            >
              📥 Export Catalogue CSV
            </a>
            <a
              href="/api/import/fourthwall?format=fourthwall-json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
            >
              📋 Intended Payload
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {loadError && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-xs text-red-300">
            Could not load status: {loadError}
          </div>
        )}

        {/* Metric Cards — each labelled with its source */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6 mb-8">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Local Catalogue</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">
              {loading ? '…' : summary?.totalArtworks ?? '—'}
            </p>
            <SourceTag>from committed JSON</SourceTag>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Publishable</p>
            <p className="mt-2 text-3xl font-extrabold text-cyan-400">
              {loading ? '…' : summary?.publishableCount ?? '—'}
            </p>
            <SourceTag>
              {summary ? `${summary.publishableWithOriginal} with original · ${summary.publishablePrintsOnly} prints only` : 'Available only'}
            </SourceTag>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Fourthwall Products</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-400">
              {loading ? '…' : typeof fw?.productCount === 'number' ? fw.productCount : '—'}
            </p>
            <SourceTag>{fw?.authenticated ? 'live from Platform API' : 'unavailable'}</SourceTag>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Connection</p>
            <p className={`mt-2 text-3xl font-extrabold ${fw?.authenticated ? 'text-purple-400' : 'text-red-400'}`}>
              {loading ? '…' : fw?.authenticated ? 'Live' : 'No'}
            </p>
            <SourceTag>{fw?.error ? 'see detail below' : fw?.authMode ? AUTH_MODE_LABEL[fw.authMode] || fw.authMode : 'unknown'}</SourceTag>
          </div>
        </div>

        {/* Fourthwall live state */}
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Fourthwall Live State</h2>
            {fw?.checkedAt && (
              <span className="text-xs text-neutral-500 font-mono">
                queried {new Date(fw.checkedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Queried from the Platform API at request time. Nothing on this page is inferred from local files.
          </p>

          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Reachable</dt>
              <dd className={fw?.reachable ? 'text-emerald-400' : 'text-red-400'}>{String(fw?.reachable ?? '—')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Authenticated</dt>
              <dd className={fw?.authenticated ? 'text-emerald-400' : 'text-red-400'}>{String(fw?.authenticated ?? '—')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Auth mode</dt>
              <dd className="text-neutral-200">{fw?.authMode ? AUTH_MODE_LABEL[fw.authMode] || fw.authMode : '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Platform API</dt>
              <dd className="truncate font-mono text-neutral-300">{fw?.platformApiUrl || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Shop</dt>
              <dd className="text-neutral-200">
                {fw?.shop ? `${fw.shop.name} (${fw.shop.status})` : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800/60 py-1.5">
              <dt className="text-neutral-400">Products</dt>
              <dd className="text-neutral-200">{typeof fw?.productCount === 'number' ? fw.productCount : '—'}</dd>
            </div>
          </dl>

          {fw?.collections && fw.collections.length > 0 && (
            <p className="mt-3 text-xs text-neutral-400">
              Collections: <span className="text-neutral-300">{fw.collections.map((c) => c.slug).join(', ')}</span>
            </p>
          )}

          {fw?.error && (
            <div className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
              {fw.error}
              {fw.httpStatus ? ` (HTTP ${fw.httpStatus})` : ''}
            </div>
          )}
        </div>

        {/* Write path status */}
        <div className="mb-8 rounded-xl border border-red-900/70 bg-red-950/20 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-red-900/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-200">
              Not implemented
            </span>
            <h2 className="text-lg font-semibold text-white">Fourthwall Write Path</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            This importer cannot push the catalogue to Fourthwall. The endpoint it previously targeted is a
            print-on-demand design pipeline, not product CRUD — it requires a product template and design regions,
            and accepts no price, variants or stock.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-neutral-400">
            <li>
              <span className="text-neutral-500">Reason:</span> <code className="text-neutral-300">{writePath?.reason || 'no-supported-endpoint'}</code>
            </li>
            <li>
              <span className="text-neutral-500">Verified against:</span>{' '}
              <a
                href={writePath?.verifiedAgainst}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                {writePath?.verifiedAgainst || 'Fourthwall API reference'}
              </a>{' '}
              <span className="text-neutral-600">({writePath?.verifiedOn})</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            The previous build reported a green <span className="font-mono">SYNC COMPLETE</span> for responses it never
            checked. It now refuses to write rather than reporting a false success.
          </p>
        </div>

        {/* Catalogue Search & Filtering */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {seriesOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeries(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  selectedSeries === s
                    ? 'bg-neutral-100 text-neutral-900 font-semibold shadow'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search title, medium, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Artworks List */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Artwork</th>
                  <th className="px-4 py-3">Series</th>
                  <th className="px-4 py-3">Medium & Dimensions</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Print Base</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.map((art) => (
                  <tr key={art.id} className="hover:bg-neutral-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="h-12 w-12 rounded object-cover border border-neutral-700 bg-neutral-800 flex-shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-semibold text-white">{art.title}</p>
                          <code className="text-[11px] text-neutral-500">{art.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300 border border-neutral-700">
                        {art.series}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      <div className="font-medium text-neutral-200">{art.medium}</div>
                      <div className="text-[11px] text-neutral-500">{art.dimensions}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{art.year}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">${art.priceUSD}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-medium border ${
                          art.status === 'Available'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : art.status === 'Archived'
                            ? 'bg-red-950/60 text-red-300 border-red-900'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/USD/product/${art.slug}`}
                        className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-neutral-700 transition"
                      >
                        View in Store →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-neutral-800 px-4 py-3 text-xs text-neutral-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {artworks.length} artworks</span>
            <span className="text-neutral-400">Local catalogue only — not a reflection of the Fourthwall store</span>
          </div>
        </div>
      </main>
    </div>
  );
}
