import { useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import Dashboard from "@/components/dashboard"
import SEO from "@/components/SEO"
import { useAttendance, useMarks } from "@/hooks/query"

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()
  const { data: attendanceApiData, isLoading: attendanceLoading } = useAttendance()
  const { data: marksApiData, isLoading: marksLoading } = useMarks()

  const hasAttendanceData = Array.isArray(attendanceApiData) && attendanceApiData.length > 0
  const hasUsableMarksData = Array.isArray(marksApiData)
    && marksApiData.some((item: any) =>
      Array.isArray(item?.marks)
      && item.marks.some((mark: any) => Number(mark?.maxMark) > 0)
    )
  const trackrDisabled = (attendanceLoading && marksLoading) ? true : (!hasAttendanceData && !hasUsableMarksData)
  const calcgpaPlusDisabled = marksLoading || !hasUsableMarksData

  const handleNavigate = (page: string) => {
    if (page === "dashboard") {
      router.push("/")
    } else {
      router.push(`/${page}`)
    }
  }

  return (
    <>
      <Head>
        <title>Studique - Campus Companion for College Students | GPA Calculator, Attendance Tracker, Notes</title>
      </Head>

      <SEO
        title="Studique - Campus Companion for SRM Students"
        description="Studique is the free campus app for SRM students - attendance tracker, GPA calculator, timetable planner, mess menu, unit-wise notes and more to make campus life easier."
        keywords="Studique, SRM, SRMIST, student app, campus companion, GPA calculator, attendance tracker, timetable planner, mess menu, unitwise notes"
        url="https://studique.in"
        canonical="https://studique.in"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Studique - Campus Companion',
            description: 'All-in-one college app for students. Track attendance, calculate GPA, view class schedule, check mess menu, find classrooms, and access study notes.',
            url: 'https://studique.in',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web Browser, All Platforms',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '500'
            },
            featureList: [
              'Attendance Tracker',
              'GPA Calculator',
              'Class Schedule Planner',
              'Mess Menu',
              'Campus Finder',
              'Study Notes',
              'Campus Events'
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Studique',
            url: 'https://studique.in',
            logo: 'https://studique.in/images/qrark.png',
            sameAs: [
              'https://github.com/UtkarshJaiswal1406/studique'
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://studique.in',
              },
            ],
          },
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar
            onNavigate={handleNavigate}
            currentPage="dashboard"
            onCollapseChange={setIsSidebarCollapsed}
            trackrDisabled={trackrDisabled}
            calcgpaPlusDisabled={calcgpaPlusDisabled}
          />
          <main
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
              }`}
          >
            <Dashboard onNavigate={handleNavigate} />
          </main>
        </div>
      </div>
    </>
  )
}

// Force server-side rendering to ensure SEO tags are in initial HTML
export async function getStaticProps() {
  // Use ISR so the home page is served from the edge and revalidated periodically.
  return {
    props: {},
    revalidate: 3600, // revalidate hourly to avoid edge-request churn
  }
}
