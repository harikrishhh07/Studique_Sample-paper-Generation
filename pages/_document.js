import { Html, Head, Main, NextScript } from "next/document";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export default function Document() {
  return (
    <Html lang="en" style={{ backgroundColor: "#0a0a0a" }}>
      <Head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NV3DQRN7');` }} />

        {/* AdSense verification */}
        <meta
          name="google-adsense-account"
          content="ca-pub-5473260678283601"
        />

        {/* Primary Meta Tags */}
        <meta name="application-name" content="Studique" />
        <meta
          name="description"
          content="Studique is an all-in-one academic companion: notes, attendance tracking, GPA calculator, mess menu, events, and study tools to simplify student life."
        />
        <meta
          name="keywords"
          content="Studique, student app, college app, campus app, GPA calculator, grade calculator, attendance tracker, attendance percentage, mess menu, meal map, timetable, schedule planner, study planner, notes, lecture notes, syllabus, unitwise, finder, helper, campusweb, events, campus events, hackathons, student community, SRM, hostels, cafeteria, PWA, progressive web app, offline support, service worker, push notifications, analytics, login, authentication, PDF viewer, calendar, reminders, study groups, resources, course materials, campus map, campus resources, exam preparation, calculators, GPA estimator, timetable generator, meal planner, student tools, student services, social, community chat, student discounts, campus directory"
        />
        <meta name="author" content="Studique Team" />

        {/* Basic robots */}
        <meta name="robots" content="index,follow" />



        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Studique - Simplify Your College Life" />
        <meta
          property="og:description"
          content="Stay on top of academics with Studique - notes, GPA calculator, attendance tracking, mess menu, events and helpful study tools in one place."
        />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        <meta property="og:url" content="https://studique.in" />
        <meta property="og:site_name" content="Studique" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:title"
          content="Studique - Simplify Your College Life"
        />
        <meta
          property="twitter:description"
          content="Your complete academic companion - notes, GPA calculator, attendance tracker, mess menu and more to simplify student life."
        />
        <meta property="twitter:image" content="/icons/icon-512x512.png" />

        {/* Favicons and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48x48.png" />
        <link rel="shortcut icon" type="image/png" href="/icons/favicon-32x32.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="mask-icon" href="/images/qrark.png" color="#f97316" />

        {/* Performance optimizations */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//youtube.com" />
        <link rel="dns-prefetch" href="//i.ytimg.com" />
        <link rel="dns-prefetch" href="//img.youtube.com" />
        <link rel="preload" href="/images/pnglogo.png" as="image" type="image/png" />
        {/* Preload primary hero/featured image to improve LCP */}
        <link rel="preload" href="/images/featured.png" as="image" type="image/png" />

        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
            background-color: #0a0a0a !important;
          }
          body {
            background-color: #0a0a0a !important;
            margin: 0;
            padding: 0;
          }
        `}</style>

        {/* Structured data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Studique",
                "url": "https://studique.in",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://studique.in/?s={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Studique",
                "url": "https://studique.in",
                "logo": "https://studique.in/icons/icon-512x512.png",
                "sameAs": [
                  "https://chat.whatsapp.com/FMZWuDow9GeA0Og8tm3rGm",
                  "https://www.instagram.com/studique.in/",
                  "https://www.linkedin.com/company/studiquecommunity",
                  "mailto:community@studique.in"
                ]
              }
            ])
          }}
        />
      </Head>
      <body className="antialiased" style={{ backgroundColor: "#0a0a0a" }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NV3DQRN7"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
