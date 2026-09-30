import { ReadonlyURLSearchParams } from 'next/navigation';

export function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  let str = value.trim();
  const match = str.match(/^["']([^"']*)["']/);
  if (match) {
    str = match[1]!.trim();
  } else {
    const hashIdx = str.indexOf('#');
    if (hashIdx !== -1) {
      str = str.slice(0, hashIdx).trim();
    }
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1).trim();
    }
  }
  return str;
}

export const getBaseUrl = (): string => {
  const raw = cleanEnv(process.env.NEXT_PUBLIC_VERCEL_URL);
  if (!raw) return 'http://localhost:3000';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
};

export const createUrl = (pathname: string, params: URLSearchParams | ReadonlyURLSearchParams) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? '?' : ''}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith) ? stringToCheck : `${startsWith}${stringToCheck}`;

export const validateEnvironmentVariables = () => {
  const requiredEnvironmentVariables = ['NEXT_PUBLIC_FW_STOREFRONT_TOKEN', 'NEXT_PUBLIC_FW_COLLECTION', 'NEXT_PUBLIC_VERCEL_URL'];
  const missingEnvironmentVariables = [] as string[];

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!cleanEnv(process.env[envVar])) {
      missingEnvironmentVariables.push(envVar);
    }
  });

  if (missingEnvironmentVariables.length) {
    console.warn(
      `[AI Studio] The following environment variables are missing or placeholders: ${missingEnvironmentVariables.join(
        ', '
      )}`
    );
  }
};

