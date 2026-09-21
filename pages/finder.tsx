import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import Finder from "@/components/pages/finder"
import SEO from '@/components/SEO';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function FinderPage() {
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
        title="Finder"
        description="Search for faculty by name or ID and get their staff room details."
        keywords="faculty finder, find professor, staff room, cabin number, faculty directory, SRM, SRM college, SRMIST"
        url="https://studique.in/finder"
        canonical="https://studique.in/finder"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Finder',
            description: 'Find faculty cabin numbers and professor office locations at SRM. Search for your professor\'s cabin number, department, and building location.',
            url: 'https://studique.in/finder',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Finder - Faculty Cabin Locator',
              applicationCategory: 'UtilitiesApplication',
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
              { '@type': 'ListItem', position: 2, name: 'Finder', item: 'https://studique.in/finder' },
            ],
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="finder"
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            }`}
          >
            <Finder />
          </main>
        </div>
      </div>
    </>
  );
}
