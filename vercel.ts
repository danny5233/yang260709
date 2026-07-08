import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      return [];
    }

    try {
      const response = await fetch(
        `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?content_type=redirect`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();

      return data.items.map((item: any) => ({
        source: item.fields.source,
        destination: item.fields.destination,
        permanent: item.fields.permanent ?? true,
      }));
    } catch (error) {
      console.error('Fetch Contentful redirects failed:', error);
      return [];
    }
  },
};

export default nextConfig;
