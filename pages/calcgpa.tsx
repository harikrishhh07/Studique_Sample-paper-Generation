import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import CalcGPA from "@/components/pages/calcgpa"
// calcgpa-new.tsx removed as duplicate
import SEO from '@/components/SEO';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function CalcGPAPage() {
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
          title="CalcGPA"
          description="Calculate your SGPA, CGPA or predict grades in seconds."
          keywords="GPA calculator, CGPA, SGPA, grade predictr, semester GPA, SRM, SRM college, SRMIST"
        url="https://studique.in/calcgpa"
        canonical="https://studique.in/calcgpa"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'GPA Calculator - Calculate Semester CGPA & SGPA',
            description: 'Calculate your college GPA, CGPA, and SGPA instantly. Enter grades and credits to estimate semester GPA, cumulative GPA, and overall CGPA.',
            url: 'https://studique.in/calcgpa',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'CalcGPA - GPA Calculator',
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
              { '@type': 'ListItem', position: 2, name: 'CalcGPA', item: 'https://studique.in/calcgpa' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Calculate Your GPA',
            description: 'Step-by-step guide to calculate your semester GPA and cumulative CGPA',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Enter Course Details',
                text: 'Add all your courses with their names and credit hours for the semester.'
              },
              {
                '@type': 'HowToStep',
                name: 'Select Grades',
                text: 'Choose the grade you received (or expect to receive) for each course from the dropdown.'
              },
              {
                '@type': 'HowToStep',
                name: 'Calculate GPA',
                text: 'Click calculate to see your semester GPA (SGPA) and cumulative GPA (CGPA) instantly.'
              }
            ]
          }
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar 
            onNavigate={handleNavigate} 
            currentPage="calcgpa"
            onCollapseChange={setIsSidebarCollapsed}
          />
          <main 
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            } `}
          >
            <div className="flex-1">
              <CalcGPA />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}