import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import Schedule from "@/components/pages/schedule"
import SEO from '@/components/SEO';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function SchedulePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Block direct route access when Schedule feature is under maintenance.
  const SCHEDULE_MAINTENANCE = false;

  useEffect(() => {
    if (SCHEDULE_MAINTENANCE) {
      // Replace the current history entry so back won't re-open the disabled page.
      router.replace('/404');
    }
  }, [router]);

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
          title="Schedule"
          description="View your daily schedule and academic planner in one place."
          keywords="daily schedule, academic planner, timetable, timetable planner, class schedule, semester planner, SRM, SRM college, SRMIST"
        url="https://studique.in/schedule"
        canonical="https://studique.in/schedule"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Class Schedule & Timetable Planner',
            description: 'Create and manage your college timetable. View daily class schedule, plan your semester, check class timings, and organize your academic calendar.',
            url: 'https://studique.in/schedule',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Schedule - Timetable Planner',
              applicationCategory: 'ProductivityApplication',
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
              { '@type': 'ListItem', position: 2, name: 'Schedule', item: 'https://studique.in/schedule' },
            ],
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="schedule"
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            }`}
          >
            <div className="flex-1">
              <Schedule autoDownload={router.query.download === '1'} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// Server-side redirect to 404 when schedule is under maintenance.
export async function getStaticProps() {
  // Serve schedule page as static + ISR — client-side redirect handles maintenance.
  return {
    props: {},
    revalidate: 3600,
  };
}
