import Link from 'next/link';

import LogoSquare from 'components/logo-square';
import { BRAND_CONFIG } from 'lib/brand-config';

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 1985 + (currentYear > 1985 ? `-${currentYear}` : '');

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 border-t border-neutral-200 px-6 py-12 text-sm md:flex-row md:gap-12 md:px-4 min-[1320px]:px-0 dark:border-neutral-700">
        <div>
          <Link className="flex items-center gap-3 text-black md:pt-1 dark:text-white group" href="/">
            <LogoSquare size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.16em] uppercase leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>
        </div>
        <div className="md:ml-auto flex items-center gap-3">
          <a
            className="flex h-8 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-medium text-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 transition"
            href={BRAND_CONFIG.domains.portfolio}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>roryskagenart.com Portfolio</span>
            <span className="text-[10px] text-neutral-400">↗</span>
          </a>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 md:flex-row md:gap-0 md:px-4 min-[1320px]:px-0">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/pages/privacy-policy" className="hover:text-black dark:hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/pages/terms-of-service" className="hover:text-black dark:hover:text-white">
              Terms of Service
            </Link>
            <Link href="/pages/returns-faq" className="hover:text-black dark:hover:text-white">
              Returns & FAQ
            </Link>
            <Link href="/pages/contact" className="hover:text-black dark:hover:text-white">
              Contact
            </Link>
            <Link href="/docs" className="hover:text-black dark:hover:text-white">
              Public Docs
            </Link>
            <Link href="/docs/dev" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              Dev/Build Docs
            </Link>
            <Link href="/import" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              Fourthwall API Sync
            </Link>
          </div>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-neutral-400 md:inline-block" />
          <p className="md:ml-auto">
            <a href="https://shop.roryskagen.com" className="text-black dark:text-white">
              Rory Skagen Studio Archive
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 md:flex-row md:gap-0 md:px-4 min-[1320px]:px-0">
          <p>
            &copy; {copyrightDate} {BRAND_CONFIG.legalName}. All rights reserved.
          </p>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-neutral-400 md:inline-block" />
          <p>
            <a href="https://github.com/FourthwallHQ/vercel-commerce">View the source</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
