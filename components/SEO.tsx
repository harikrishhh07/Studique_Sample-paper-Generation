import Head from 'next/head';
import { sanitizeForJSON } from '@/utils/security';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  locale?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  alternateLanguages?: Array<{ hrefLang: string; href: string }>;
  structuredData?: object;
}

const defaultSEO = {
  title: 'Studique - Your Campus Companion',
  description:
    'Studique is the free campus app for SRM students - GPA calculator, attendance tracker, timetable planner, mess menu, unit-wise notes, and campus events to simplify student life on campus.',
  keywords:
    'Studique, student app, helper, campusweb, college app, campus app, GPA calculator, grade calculator, attendance tracker, attendance percentage, mess menu, meal map, timetable, schedule planner, study planner, notes, lecture notes, syllabus, unitwise, finder, events, campus events, hackathons, student community, SRM, srm, SRM college, SRM University, SRMIST, hostels, cafeteria, PWA, progressive web app, offline support, service worker, push notifications, analytics, login, authentication, PDF viewer, calendar, reminders, study groups, resources, course materials, campus map, campus resources, exam preparation, calculators, GPA estimator, timetable generator, meal planner, student tools, student services, social, community chat, student discounts, campus directory',
  author: 'Studique Team',
  image: 'https://studique.in/images/pnglogo.png',
  url: 'https://studique.in',
  type: 'website',
  siteName: 'Studique',
  twitterCard: 'summary_large_image',
  locale: 'en_US',
};

export default function SEO({
  title,
  description,
  keywords,
  author,
  image,
  url,
  type = 'website',
  siteName,
  twitterCard = 'summary_large_image',
  locale = 'en_US',
  noindex = false,
  nofollow = false,
  canonical,
  alternateLanguages = [],
  structuredData,
}: SEOProps) {
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoAuthor = author || defaultSEO.author;
  const seoImage = image || defaultSEO.image;
  const seoUrl = url || defaultSEO.url;
  const seoSiteName = siteName || defaultSEO.siteName;
  // Use a title template so page titles appear as "Page | SiteName"
  // Avoid duplicating the site name when pages already include it (case-insensitive).
  const normalizedSiteName = (seoSiteName || '').trim().toLowerCase();
  const seoTitle = title
    ? (title.toLowerCase().includes(normalizedSiteName) || title.trim() === seoSiteName
        ? title
        : `${title} | ${seoSiteName}`)
    : defaultSEO.title;

  const robotsContent = `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: seoSiteName,
    description: seoDescription,
    url: seoUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    logo: seoImage, // ✅ ensure logo is included
    // Indicate the app is free; use INR as currency for India-first audience
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    author: {
      '@type': 'Organization',
      name: seoAuthor,
      logo: seoImage,
    },
    publisher: {
      '@type': 'Organization',
      name: seoSiteName,
      logo: seoImage,
    },
    // aggregateRating intentionally omitted to avoid hard-coded rating data
  };

  // Add complementary structured data (WebSite + Organization + SearchAction) to improve search visibility
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoSiteName,
    url: seoUrl,
    description: seoDescription,
    publisher: {
      '@type': 'Organization',
      name: seoSiteName,
      logo: {
        '@type': 'ImageObject',
        url: seoImage,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seoUrl}/?s={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoSiteName,
    url: seoUrl,
    logo: seoImage,
    sameAs: [
      'https://chat.whatsapp.com/FMZWuDow9GeA0Og8tm3rGm',
      'https://www.instagram.com/studique.in/',
      'https://www.linkedin.com/company/studiquecommunity',
      'mailto:community@studique.in'
    ]
  }

  // Allow callers to *extend* structured data; merge page-specific graphs with defaults
  // Filter out any undefined/null objects or objects without @context property to prevent runtime hydration errors.
  const incomingStructured: any[] = structuredData
    ? (Array.isArray(structuredData) ? structuredData : [structuredData])
        .filter((item) => Boolean(item && typeof item === 'object'))
    : [];

  const finalStructuredData = ([defaultStructuredData, websiteStructuredData, organizationStructuredData] as any[])
    .concat(incomingStructured)
    .filter((item) => Boolean(item && typeof item === 'object' && item['@context']));

  // NOTE: animated SVG favicon removed to avoid conflicting favicon declarations.
  // Favicons are provided centrally in `pages/_document.js` (static icons in /public/icons).

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content={seoAuthor} />
      <meta name="robots" content={robotsContent} />
      {/* Viewport is set globally in `pages/_document.js` to avoid duplicate meta warnings */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Alternate Languages */}
      {alternateLanguages.map((lang, index) => (
        <link key={index} rel="alternate" hrefLang={lang.hrefLang} href={lang.href} />
      ))}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={seoSiteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:site" content="@StudiqueApp" />
      <meta name="twitter:creator" content="@StudiqueApp" />

      {/* Favicon is served from pages/_document.js to keep a single canonical source */}
      {/* Icon links removed from SEO component to prevent duplicate requests */}
      {/* All icon/favicon links are in _document.js */}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sanitizeForJSON(finalStructuredData)),
        }}
      />

      {/* Additional Open Graph hints for image sizes to help social previews */}
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content="Studique - Your Campus Companion" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </Head>
  );
}
