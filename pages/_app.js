import "@/styles/globals.css";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useEffect } from 'react';
import QueryProvider from '@/components/provider';
import { useRouter } from 'next/router';
import Script from "next/script";

function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Clean up old banned user flags (older than 5 minutes) on app start
    if (typeof window !== 'undefined') {
      const sessionTime = sessionStorage.getItem('logged-out-banned-user-time');
      const localTime = localStorage.getItem('logged-out-banned-user-time');
      const timeToCheck = sessionTime || localTime;
      
      if (timeToCheck) {
        const timeDiff = Date.now() - parseInt(timeToCheck);
        if (timeDiff > 5 * 60 * 1000) { // 5 minutes
          sessionStorage.removeItem('logged-out-banned-user');
          sessionStorage.removeItem('logged-out-banned-user-time');
          localStorage.removeItem('logged-out-banned-user');
          localStorage.removeItem('logged-out-banned-user-time');
        }
      }
    }
    
    // Prevent zoom on iOS
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
    };
  }, []);

  return (
    <>
      <QueryProvider>
        {/* AdSense Auto Ads */}
        <Script
          id="adsense-script"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5473260678283601"
          crossOrigin="anonymous"
        />
        <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
          <Component {...pageProps} />
        </div>
      </QueryProvider>
    </>
  );
}

export default App;
