import { getCollectionProducts } from 'lib/fourthwall';
import { getBaseUrl, validateEnvironmentVariables } from 'lib/utils';
import { MetadataRoute } from 'next';

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();
  const baseUrl = getBaseUrl();

  const routesMap = [''].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString()
  }));

  let fetchedRoutes: Route[] = [];

  try {
    const products = await getCollectionProducts({ collection: 'all', currency: 'USD', limit: 100 });
    fetchedRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${product.handle}`,
      lastModified: product.updatedAt
    }));
  } catch (error) {
    console.warn('[AI Studio] Sitemap could not fetch products:', error);
  }

  return [...routesMap, ...fetchedRoutes];
}
