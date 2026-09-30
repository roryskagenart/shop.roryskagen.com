import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { BRAND_CONFIG } from 'lib/brand-config';
import { getCollections } from 'lib/fourthwall';
import Link from 'next/link';
import { CurrencySelector } from './currency';

export async function Navbar({currency}: {currency: string}) {
  const collections = await getCollections()

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="flex w-full items-center">
        <div className="flex w-full md:w-1/3">
          <Link
            href={`/${currency}`}
            prefetch={true}
            className="mr-3 flex w-full items-center justify-center md:w-auto lg:mr-6 group text-left"
          >
            <LogoSquare />
            <div className="ml-2.5 flex flex-col justify-center">
              <span className="text-sm font-black tracking-[0.18em] uppercase text-black dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                {BRAND_CONFIG.name}
              </span>
              <span className="hidden sm:inline-block text-[9px] uppercase tracking-[0.22em] text-neutral-500 font-mono">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </Link>
          {collections.length ? (
            <ul className="hidden gap-5 text-xs font-medium md:flex md:items-center">
              {collections.map((item) => (
                <li key={item.title}>
                  <Link
                    href={`/${currency}/collections/${item.handle}`}
                    prefetch={true}
                    className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hidden justify-center md:flex md:w-1/3">
        </div>
        <div className="flex justify-end items-center md:w-1/3 gap-3">
          <Link
            href="/docs"
            className="hidden sm:inline-block text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          >
            Docs
          </Link>
          <Link
            href="/docs/dev"
            className="hidden sm:inline-block text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            Dev/Build
          </Link>
          <CurrencySelector currency={currency} />
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
