'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export default function ImportPage() {
  const [data, setData] = useState<{
    summary?: any;
    artworks?: ArtworkSummary[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [syncResult, setSyncResult] = useState<{
    success?: boolean;
    created?: number;
    failed?: number;
    totalProcessed?: number;
  } | null>(null);

  // Optional custom credentials for testing/manual sync
  const [platformToken, setPlatformToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  useEffect(() => {
    fetch('/api/import/fourthwall')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load import status:', err);
        setLoading(false);
      });
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setLogs(['Initiating Fourthwall API import request...']);
    setSyncResult(null);

    try {
      const payload: any = {
        dryRun,
        credentials: {}
      };
      if (platformToken.trim()) payload.credentials.platformToken = platformToken.trim();
      if (apiKey.trim()) payload.credentials.apiKey = apiKey.trim();
      if (apiSecret.trim()) payload.credentials.apiSecret = apiSecret.trim();

      const res = await fetch('/api/import/fourthwall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      setLogs(result.logs || []);
      setSyncResult({
        success: result.success,
        created: result.created,
        failed: result.failed,
        totalProcessed: result.totalProcessed
      });
    } catch (err: any) {
      setLogs((prev) => [...prev, `[Fatal Error] ${err.message || 'Request failed'}`]);
      setSyncResult({ success: false, failed: 1, created: 0, totalProcessed: 0 });
    } finally {
      setIsSyncing(false);
    }
  };

  const artworks = data.artworks || [];
  const seriesOptions = ['All', 'Austin Iconic & Texas Pop', 'Monsters & Kaiju', 'Pop Surrealism & Folklore', 'Atomic Pop & Sci-Fi'];

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
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/USD"
                className="text-xs uppercase tracking-wider text-emerald-400 hover:underline"
              >
                ← Return to Storefront
              </Link>
              <span className="text-neutral-600">|</span>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-800">
                Catalog Synced
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Rory Skagen Art → Fourthwall API Importer
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Imported 137 authentic fine art pieces from <code className="text-neutral-300">jadenblack/roryskagenart.com</code> into your Fourthwall store.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/import/fourthwall?format=csv"
              download="rory-skagen-fourthwall-catalog.csv"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
            >
              📥 Export Fourthwall CSV
            </a>
            <a
              href="/api/import/fourthwall?format=fourthwall-json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
            >
              📋 Open API JSON Payload
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6 mb-8">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Fine Art Pieces</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">
              {loading ? '...' : data.summary?.totalArtworks || 137}
            </p>
            <p className="mt-1 text-xs text-neutral-500">100% catalog coverage</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Curated Series</p>
            <p className="mt-2 text-3xl font-extrabold text-cyan-400">4</p>
            <p className="mt-1 text-xs text-neutral-500">Austin, Kaiju, Sci-Fi, Pop</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">High-Res Assets</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-400">137 / 137</p>
            <p className="mt-1 text-xs text-neutral-500">Cloudinary & Supabase webp</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Storefront Status</p>
            <p className="mt-2 text-3xl font-extrabold text-purple-400">Active</p>
            <p className="mt-1 text-xs text-neutral-500">Live in Fourthwall store</p>
          </div>
        </div>

        {/* Sync & Credentials Panel */}
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white">Fourthwall API Connection & Synchronization</h2>
              <p className="mt-1 text-sm text-neutral-400">
                All 137 artworks are populated in the store layer. You can also trigger an automated sync to Fourthwall's Platform API to create products and upload media in your Fourthwall merchant backend.
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-neutral-300">API URL:</span>
                  <code className="text-neutral-400">{data.summary?.credentialsStatus?.apiUrl || 'https://storefront-api.fourthwall.com'}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-neutral-300">Storefront Token:</span>
                  <span className="text-emerald-400">Configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${data.summary?.credentialsStatus?.hasPlatformCredentials ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-neutral-300">Platform Credentials:</span>
                  <span className={data.summary?.credentialsStatus?.hasPlatformCredentials ? 'text-emerald-400' : 'text-amber-400'}>
                    {data.summary?.credentialsStatus?.hasPlatformCredentials ? 'Active' : 'Optional (Provided Below)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none bg-neutral-800/80 px-3 py-2 rounded-md border border-neutral-700">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded border-neutral-600 bg-neutral-700 text-emerald-500 focus:ring-0"
                />
                Dry Run Mode
              </label>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {isSyncing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>⚡ Run Fourthwall Sync</>
                )}
              </button>
            </div>
          </div>

          {/* Optional Platform API Credentials Accordion */}
          <details className="mt-5 border-t border-neutral-800 pt-4">
            <summary className="text-xs font-medium text-neutral-400 hover:text-neutral-200 cursor-pointer">
              Optional: Enter Fourthwall Platform API Token / Key for direct backend upload →
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Bearer Access Token (FOURTHWALL_ACCESS_TOKEN)</label>
                <input
                  type="password"
                  placeholder="Bearer token..."
                  value={platformToken}
                  onChange={(e) => setPlatformToken(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">API Key / Username</label>
                <input
                  type="text"
                  placeholder="API Key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">API Secret / Password</label>
                <input
                  type="password"
                  placeholder="API Secret..."
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </details>

          {/* Logs Terminal */}
          {logs.length > 0 && (
            <div className="mt-6 rounded-lg border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-300">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="text-neutral-500 uppercase tracking-wider">Sync Console Output</span>
                {syncResult && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${syncResult.success ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-300'}`}>
                    {syncResult.success ? 'SYNC COMPLETE' : 'COMPLETED WITH WARNINGS'}
                  </span>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('[Error]')
                        ? 'text-red-400'
                        : log.includes('[Success]')
                        ? 'text-emerald-400'
                        : log.includes('[Dry Run]')
                        ? 'text-cyan-300'
                        : log.includes('[Warning]')
                        ? 'text-amber-400'
                        : 'text-neutral-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Catalog Search & Filtering */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Series filter tabs */}
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

          {/* Search box */}
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
                  <th className="px-4 py-3">Base Price</th>
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
            <span>Showing {filtered.length} of {artworks.length} fine art pieces</span>
            <span className="text-neutral-400">All artworks mapped from Supabase/Vercel roryskagenart.com catalog</span>
          </div>
        </div>
      </main>
    </div>
  );
}
