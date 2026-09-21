import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import Trackr from "@/components/pages/trackr"
import SEO from '@/components/SEO';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function TrackrPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleNavigate = (page: string) => {
    if (page === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${page}`);
    }
  };

  return (
    <>
      <SEO
        title="Trackr"
        description="Trackr brings your attendance and marks together."
        keywords="attendance tracker, college attendance, attendance percentage, track attendance, class attendance, attendance monitor, attendance app, SRM, SRM college, SRMIST"
        url="https://studique.in/trackr"
        canonical="https://studique.in/trackr"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Attendance Tracker - Monitor Classes & Attendance Percentage',
            description: 'Track your college attendance easily. Monitor class attendance percentage, check attendance requirements, get low attendance alerts for the 75% criteria.',
            url: 'https://studique.in/trackr',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Trackr - Attendance Tracker',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR'
              }
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://studique.in' },
              { '@type': 'ListItem', position: 2, name: 'Trackr', item: 'https://studique.in/trackr' },
            ],
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="trackr"
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            }`}
          >
            <div className="flex-1">
              <Trackr />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}