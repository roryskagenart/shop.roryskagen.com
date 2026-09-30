'use client';

import { BRAND_CONFIG } from 'lib/brand-config';
import {
  DEV_DOCS_STRUCTURE,
  DocCategory,
  DocPageContent,
  PUBLIC_DOCS_STRUCTURE
} from 'lib/docs-content';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

interface DocsLayoutProps {
  currentScope: 'public' | 'dev';
  currentSlug: string;
  doc: DocPageContent | null;
  children?: React.ReactNode;
}

export function DocsLayout({
  currentScope,
  currentSlug,
  doc,
  children
}: DocsLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const structure: DocCategory[] =
    currentScope === 'dev' ? DEV_DOCS_STRUCTURE : PUBLIC_DOCS_STRUCTURE;

  // Filter sections by search query
  const filteredStructure = structure.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((cat) => cat.items.length > 0);

  // Compute Prev / Next navigation links
  const allItems = structure.flatMap((c) => c.items);
  const currentIndex = allItems.findIndex((item) => item.slug === currentSlug);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < allItems.length - 1
      ? allItems[currentIndex + 1]
      : null;

  const basePath = currentScope === 'dev' ? '/docs/dev' : '/docs';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Header / Fumadocs Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden rounded-md border border-neutral-800 p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
              aria-label="Toggle Navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/USD" className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 group">
              <img
                src={BRAND_CONFIG.assets.icon192}
                alt={BRAND_CONFIG.name}
                className="h-7 w-7 rounded-md object-cover border border-neutral-700 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-white leading-tight">
                  {BRAND_CONFIG.name}
                </span>
                <span className="hidden sm:inline-block text-[8px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                  {BRAND_CONFIG.tagline}
                </span>
              </div>
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 border border-neutral-700 ml-1">
                Docs
              </span>
            </Link>

            {/* Scope Switcher: Public vs Dev */}
            <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/90 p-1 text-xs font-medium">
              <Link
                href="/docs"
                className={`rounded-md px-3 py-1.5 transition ${
                  currentScope === 'public'
                    ? 'bg-neutral-100 text-neutral-900 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                📖 Public Docs
              </Link>
              <Link
                href="/docs/dev"
                className={`rounded-md px-3 py-1.5 transition ${
                  currentScope === 'dev'
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ⚡ Dev & Build
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/import"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-neutral-800 transition"
            >
              <span>Sync Dashboard</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </Link>

            <Link
              href="/USD"
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-white transition"
            >
              <span>Storefront</span>
              <span className="text-[10px]">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 lg:px-8">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-neutral-800 bg-neutral-950 p-6 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:p-0 md:pt-8 md:pr-8 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between pb-4 md:hidden border-b border-neutral-800 mb-4">
            <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
              {currentScope === 'dev' ? 'Dev Documentation' : 'Public Documentation'}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Search box */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2">
            {filteredStructure.map((category) => (
              <div key={category.title}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  {category.title}
                </p>
                <ul className="space-y-1">
                  {category.items.map((item) => {
                    const isSelected = item.slug === currentSlug;
                    const itemPath =
                      item.slug === 'overview'
                        ? basePath
                        : `${basePath}/${item.slug}`;

                    return (
                      <li key={item.slug}>
                        <Link
                          href={itemPath}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition ${
                            isSelected
                              ? 'bg-emerald-950/70 font-semibold text-emerald-300 border border-emerald-800/80'
                              : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
                                isSelected
                                  ? 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 py-8 md:px-8">
          {doc ? (
            <article className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                <span>{currentScope === 'dev' ? 'Developer' : 'Public'}</span>
                <span>/</span>
                <span>{doc.category}</span>
                <span>/</span>
                <span className="text-neutral-300">{doc.title}</span>
              </div>

              {/* Title & Header */}
              <div className="border-b border-neutral-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                    {doc.title}
                  </h1>
                  {doc.badge && (
                    <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800">
                      {doc.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-base text-neutral-400 leading-relaxed">
                  {doc.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
                  <span>Last revised: {doc.lastUpdated}</span>
                  <span>•</span>
                  <span>Rory Skagen Art Studio Docs</span>
                </div>
              </div>

              {/* Render Document Content */}
              <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-emerald-400 hover:prose-a:underline prose-code:rounded prose-code:bg-neutral-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-300 prose-pre:border prose-pre:border-neutral-800 prose-pre:bg-neutral-900 prose-table:border prose-table:border-neutral-800 prose-th:bg-neutral-900/80 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                <FormattedMarkdown content={doc.content} />
              </div>

              {/* Prev / Next Footer Nav */}
              <div className="mt-14 border-t border-neutral-800 pt-6 flex items-center justify-between">
                {prevItem ? (
                  <Link
                    href={
                      prevItem.slug === 'overview'
                        ? basePath
                        : `${basePath}/${prevItem.slug}`
                    }
                    className="flex flex-col text-left group"
                  >
                    <span className="text-xs text-neutral-500 group-hover:text-emerald-400 transition">
                      ← Previous
                    </span>
                    <span className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                      {prevItem.title}
                    </span>
                  </Link>
                ) : <div />}

                {nextItem ? (
                  <Link
                    href={`${basePath}/${nextItem.slug}`}
                    className="flex flex-col text-right group ml-auto"
                  >
                    <span className="text-xs text-neutral-500 group-hover:text-emerald-400 transition">
                      Next →
                    </span>
                    <span className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                      {nextItem.title}
                    </span>
                  </Link>
                ) : <div />}
              </div>
            </article>
          ) : (
            <div className="py-16 text-center">
              <h2 className="text-2xl font-bold text-white">Document Not Found</h2>
              <p className="mt-2 text-sm text-neutral-400">
                The requested documentation section does not exist.
              </p>
              <Link
                href={basePath}
                className="mt-6 inline-block rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Return to {currentScope === 'dev' ? 'Dev Overview' : 'Public Overview'}
              </Link>
            </div>
          )}

          {children}
        </main>

        {/* Right Sidebar: Table of Contents */}
        {doc && doc.tableOfContents && doc.tableOfContents.length > 0 && (
          <aside className="hidden xl:block w-64 pt-8 pl-8 border-l border-neutral-800/60 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              On this page
            </p>
            <ul className="space-y-2 text-xs">
              {doc.tableOfContents.map((toc) => (
                <li key={toc.id} style={{ marginLeft: (toc.level - 2) * 12 }}>
                  <a
                    href={`#${toc.id}`}
                    className="text-neutral-400 hover:text-emerald-400 transition block truncate"
                  >
                    {toc.title}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-neutral-800 pt-4">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/import"
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
                >
                  <span>⚡ Fourthwall Importer</span>
                </Link>
                <a
                  href="/api/import/fourthwall?format=csv"
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
                >
                  <span>📥 Download Catalog CSV</span>
                </a>
                <Link
                  href="/USD"
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
                >
                  <span>🎨 Browse Live Store</span>
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Clean markdown formatter for Fumadocs
 */
function FormattedMarkdown({ content }: { content: string }) {
  // Simple, resilient markdown renderer without external heavy parsers
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let tableRows: string[][] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="my-4 ml-6 list-disc space-y-1.5 text-neutral-300 text-sm">
          {currentList.map((li, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(li) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      const [headerRow, ...bodyRows] = tableRows;
      elements.push(
        <div key={`table-${key}`} className="my-6 overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-xs">
            {headerRow && (
              <thead className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-300 font-semibold uppercase tracking-wider">
                <tr>
                  {headerRow.map((th, i) => (
                    <th key={i} className="px-4 py-3" dangerouslySetInnerHTML={{ __html: formatInline(th.trim()) }} />
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-900/30">
                  {row.map((td, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-neutral-300" dangerouslySetInnerHTML={{ __html: formatInline(td.trim()) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-5 rounded-lg border border-neutral-800 bg-neutral-900/90 p-4 font-mono text-xs overflow-x-auto text-emerald-300">
            {codeLang && (
              <div className="text-[10px] uppercase font-bold text-neutral-500 mb-2 border-b border-neutral-800 pb-1">
                {codeLang}
              </div>
            )}
            <pre><code>{codeBuffer.join('\n')}</code></pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Table rows
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (line.includes('---')) continue; // skip divider
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (tableRows.length > 0) {
      flushTable(i);
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      currentList.push(line.trim().slice(2));
      continue;
    } else if (currentList.length > 0) {
      flushList(i);
    }

    // Headings
    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '').trim();
      const id = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      elements.push(
        <h2 key={i} id={id} className="mt-8 mb-4 text-xl font-bold tracking-tight text-white scroll-mt-20">
          {headingText}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      const headingText = line.replace('### ', '').trim();
      elements.push(
        <h3 key={i} className="mt-6 mb-3 text-base font-semibold text-neutral-200">
          {headingText}
        </h3>
      );
      continue;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-8 border-neutral-800" />);
      continue;
    }

    if (line.trim() !== '') {
      elements.push(
        <p key={i} className="my-3 text-sm text-neutral-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    }
  }

  flushList(lines.length);
  flushTable(lines.length);

  return <>{elements}</>;
}

function formatInline(str: string): string {
  return str
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-neutral-200">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-900 px-1.5 py-0.5 text-emerald-300 border border-neutral-800 font-mono text-[11px]">$1</code>');
}
