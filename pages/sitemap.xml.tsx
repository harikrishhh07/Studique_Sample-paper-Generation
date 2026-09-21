import { GetServerSideProps } from 'next';

function generateSiteMap() {
  const baseUrl = 'https://studique.in';
  
  // Define your static routes with metadata for better SEO
  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },  // homepage - highest priority
    { path: '/trackr', priority: '0.9', changefreq: 'weekly' },  // high value tools
    { path: '/calcgpa-plus', priority: '0.9', changefreq: 'weekly' },
    { path: '/calcgpa', priority: '0.9', changefreq: 'weekly' },
    { path: '/schedule', priority: '0.9', changefreq: 'weekly' },
    { path: '/finder', priority: '0.9', changefreq: 'weekly' },
    { path: '/mealmap', priority: '0.8', changefreq: 'daily' },  // daily updates
    { path: '/unitwise', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/termsofservice', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacypolicy', priority: '0.5', changefreq: 'monthly' },
  ];

  // Generate URLs with priority and changefreq
  const urls = staticRoutes.map((route) => {
    return `
    <url>
      <loc>${baseUrl}${route.path}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${urls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Generate the XML sitemap
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

// Default export to prevent next.js errors
export default function SitemapXml() {
  return null;
}
