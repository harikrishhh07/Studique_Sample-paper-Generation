import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import UnitWise from "@/components/pages/unitwise"
import SEO from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function UnitWisePage() {
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
        title="UnitWise"
        description="Find PPTs, PYQs, syllabus and even YT playlists for your subject."
        keywords="unit-wise notes, PPTs, PYQs, syllabus, study resources, subject notes, SRM, SRM college, SRMIST"
        url="https://studique.in/unitwise"
        canonical="https://studique.in/unitwise"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Study Notes & Resources - Unit-wise Notes',
            description: 'Access free unit-wise study notes, lecture PDFs, syllabus, previous year papers, and course materials for all subjects.',
            url: 'https://studique.in/unitwise',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Unitwise - Study Notes',
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
              { '@type': 'ListItem', position: 2, name: 'Unitwise', item: 'https://studique.in/unitwise' },
            ],
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="unitwise"
            onCollapseChange={setIsSidebarCollapsed}
          />

          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${(isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60')} `}
          >
            <div className="flex-1">
              <UnitWise />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
