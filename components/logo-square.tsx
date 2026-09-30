import clsx from 'clsx';
import { BRAND_CONFIG } from 'lib/brand-config';
import Image from 'next/image';
import LogoIcon from './icons/logo';

export default function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  if (BRAND_CONFIG.features.brandExperienceV1) {
    return (
      <div
        className={clsx(
          'flex flex-none items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-xs transition-transform group-hover:scale-105 dark:border-neutral-700 dark:bg-neutral-900',
          {
            'h-9 w-9': !size,
            'h-7 w-7': size === 'sm'
          }
        )}
      >
        <Image
          src={BRAND_CONFIG.assets.icon192}
          alt={BRAND_CONFIG.name}
          width={size === 'sm' ? 28 : 36}
          height={size === 'sm' ? 28 : 36}
          className="h-full w-full object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black',
        {
          'h-[40px] w-[40px] rounded-xl': !size,
          'h-[30px] w-[30px] rounded-lg': size === 'sm'
        }
      )}
    >
      <LogoIcon
        className={clsx({
          'h-[16px] w-[16px]': !size,
          'h-[10px] w-[10px]': size === 'sm'
        })}
      />
    </div>
  );
}
