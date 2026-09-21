"use client";

import Background from "@/components/ui/background"
import AppSidebar from "@/components/ui/sidebar"
import SEO from "@/components/SEO"
import { useMarks, useCourse, useAttendance } from "@/hooks/query";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import DynamicGradeCalculator from "@/components/pages/calcgpa-plus";

export default function CalcGpaPlusPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const { data: marksApiData, isPending, isError, error: marksError } = useMarks();
  const { data: attendanceApiData } = useAttendance();
  const { data: courseData } = useCourse();

  const handleNavigate = (page: string) => {
    if (page === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${page}`);
    }
  };

  const normalizeCourseKey = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  const parseCourseCredit = (creditValue: unknown) => {
    if (typeof creditValue === "number" && Number.isFinite(creditValue)) {
      return creditValue;
    }

    if (typeof creditValue === "string") {
      const parsed = Number(creditValue.trim());
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const getCourseCredit = (course: any) =>
    parseCourseCredit(
      course?.courseCredit ??
        course?.Credit ??
        course?.credit ??
        course?.credits
    );

  const transformMarksData = (marks: any[], coursesRaw: any) => {
    if (!marks) return [];

    const courses = Array.isArray(coursesRaw)
      ? coursesRaw
      : coursesRaw?.courseList || [];

    const uniqueByCourse = new Map<string, any>();

    marks.forEach((item) => {
      const subjectKey = normalizeCourseKey(item.course);
      const course = courses.find((c: any) => {
        const courseCodeKey = normalizeCourseKey(c?.courseCode);
        const courseTitleKey = normalizeCourseKey(c?.courseTitle);

        return (
          courseCodeKey === subjectKey ||
          courseTitleKey === subjectKey ||
          courseCodeKey.includes(subjectKey) ||
          subjectKey.includes(courseCodeKey)
        );
      });

      const totalMarks =
        item?.marks?.reduce(
          (sum: number, m: any) => sum + (m?.obtained || 0),
          0
        ) || 0;

      const totalMaxMarks =
        item?.marks?.reduce(
          (sum: number, m: any) => sum + (m?.maxMark || 0),
          0
        ) || 0;

      const nextEntry = {
        code: item.course,
        title: course?.courseTitle || item.course,
        credits: getCourseCredit(course),
        totalMarks,
        totalMaxMarks,
      };

      const existingEntry = uniqueByCourse.get(subjectKey);
      if (!existingEntry) {
        uniqueByCourse.set(subjectKey, nextEntry);
        return;
      }

      const existingHasCredits = Number(existingEntry.credits) > 0;
      const nextHasCredits = Number(nextEntry.credits) > 0;

      if (!existingHasCredits && nextHasCredits) {
        uniqueByCourse.set(subjectKey, nextEntry);
      }
    });

    return Array.from(uniqueByCourse.values());
  };

  const marksData = useMemo(() => {
    return transformMarksData(marksApiData || [], courseData);
  }, [marksApiData, courseData]);
  const hasUsableMarksData = Array.isArray(marksApiData)
    && marksApiData.some((item: any) =>
      Array.isArray(item?.marks)
      && item.marks.some((mark: any) => Number(mark?.maxMark) > 0)
    );
  const hasAttendanceData = Array.isArray(attendanceApiData) && attendanceApiData.length > 0;
  const marksErrorMessage = marksError instanceof Error ? marksError.message : String(marksError ?? "");
  const isNoMarksError = /marks table not found|no marks|not updated/i.test(marksErrorMessage);
  const isNoMarksYet = isNoMarksError || (Array.isArray(marksApiData) && !hasUsableMarksData);
  const calcgpaPlusDisabled = isPending || isNoMarksYet;
  const trackrDisabled = !hasAttendanceData && !hasUsableMarksData;

  useEffect(() => {
    if (calcgpaPlusDisabled && !isPending) {
      router.replace("/");
    }
  }, [calcgpaPlusDisabled, isPending, router]);

  if (isPending) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (isError && !isNoMarksYet) {
    return <div className="text-red-400 p-10">Error loading data</div>;
  }

  if (calcgpaPlusDisabled) {
    return null;
  }

  return (
    <>
      <SEO
        title="CalcGPA+"
        description="Calculate grade outcomes and CGPA impact from your current internal marks."
        keywords="Calcgpa+, grade calculator, CGPA predictor, internal marks, external marks, semester marks, SRM, SRMIST"
        url="https://studique.in/calcgpa-plus"
        canonical="https://studique.in/calcgpa-plus"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'CalcGPA+ - Predict Grades and CGPA',
            description: 'Estimate required external marks and calculate CGPA impact based on internal marks and target grade.',
            url: 'https://studique.in/calcgpa-plus',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'CalcGPA+',
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
              { '@type': 'ListItem', position: 2, name: 'CalcGPA+', item: 'https://studique.in/calcgpa-plus' },
            ],
          },
        ]}
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar
            onNavigate={handleNavigate}
            currentPage="calcgpa-plus"
            onCollapseChange={setIsSidebarCollapsed}
            trackrDisabled={trackrDisabled}
            calcgpaPlusDisabled={calcgpaPlusDisabled}
          />

          <main
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'md:ml-20' : 'md:ml-20 lg:ml-60'
            }`}
          >
            <div className="flex-1">
              <div className="bg-[#0b0b0f] min-h-screen p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  <DynamicGradeCalculator marksData={marksData} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
