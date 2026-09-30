'use client';

import clsx from "clsx";
import { Collection } from "lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

function PathFilterItem({ item }: { item: Collection }) {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const currency = (parts.length > 0 && ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(parts[0]!)) ? parts[0] : 'USD';
  const url = `/${currency}/collections/${item.handle}`;
  const active = pathname === url || pathname.endsWith(`/collections/${item.handle}`);
  const DynamicTag = active ? 'p' : Link;

  return (
    <li className="mt-1.5 flex text-black dark:text-white" key={item.handle}>
      <DynamicTag
        href={url}
        className={clsx(
          'w-full text-xs font-medium transition-colors py-1 px-2.5 rounded-md block',
          {
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-semibold shadow-xs': active,
            'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white': !active
          }
        )}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterList({ list, title }: { list: Collection[]; title?: string }) {
  return (
    <>
      <nav>
        {title ? (
          <h3 className="hidden text-xs text-neutral-500 dark:text-neutral-400 md:block">
            {title}
          </h3>
        ) : null}
        <ul className="hidden md:block">
          {list.map((item: Collection, i) => (
            <PathFilterItem key={i} item={item} />
          ))}
        </ul>
      </nav>
    </>
  );
}

export default function Collections({ collections }: { collections: Collection[] }) {
  return <FilterList list={collections} title="Collections" />;
}