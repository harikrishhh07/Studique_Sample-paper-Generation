import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import MealMap from "@/components/pages/mealmap"
import SEO from '@/components/SEO';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function MealMapPage() {
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
        title="MealMap"
        description="Daily mess menus for all hostels, so you always know what's cooking."
        keywords="mess menu, mess menu today, hostel mess menu, cafeteria locations, campus dining, SRM, SRM college, SRMIST"
        url="https://studique.in/mealmap"
        canonical="https://studique.in/mealmap"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Mess Menu & Cafeteria Guide',
            description: "Check today's mess menu, hostel mess timings, and cafeteria locations at SRM. View daily meals, breakfast/lunch/dinner menu, and plan your campus meals.",
            url: 'https://studique.in/mealmap',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'MealMap - Mess Menu',
              applicationCategory: 'LifestyleApplication',
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
              { '@type': 'ListItem', position: 2, name: 'MealMap', item: 'https://studique.in/mealmap' },
            ],
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="mealmap"
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            } `}
          >
            <div className="flex-1">
              <MealMap />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
