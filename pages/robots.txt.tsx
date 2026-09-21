import { GetServerSideProps } from 'next';

function generateRobotsTxt() {
  return `# *
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin

# Sitemap
Sitemap: https://studique.in/sitemap.xml

# Host
Host: https://studique.in
`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const robotsTxt = generateRobotsTxt();

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(robotsTxt);
  res.end();

  return {
    props: {},
  };
};

export default function RobotsTxt() {
  return null;
}
