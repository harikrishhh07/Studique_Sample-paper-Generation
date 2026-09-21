import React from "react";
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Calendar } from "@/components/ui/calendar";
import { useAttendance, useCalendar, useMarks, useTimetable, useUserInfo } from "@/hooks/query";
import { GlobalLoader } from "../loader";

// Small helper component: renders one marks component box and handles tooltip-on-truncate
function MarksComponentBox({ component, isFirst, spanClass, highlightClass, formatMark }: { component: any; isFirst: boolean; spanClass: string; highlightClass: string; formatMark: (v: any) => string }) {
  // Render a full-width pill-like box that wraps text instead of truncating.
  return (
    <div className={`w-full flex items-center justify-center px-2 py-1 ${spanClass} rounded-md border ${highlightClass} relative`} style={{ overflow: 'visible' }}>
      <span className="text-[10px] sm:text-xs font-medium text-white w-full text-center block whitespace-normal wrap-break-word" title={`${component.name}: ${formatMark(component.obtained)}/${formatMark(component.maxMark)}`}>
        {component.name}: {formatMark(component.obtained)}/{formatMark(component.maxMark)}
      </span>
    </div>
  );
}

function RefreshButton({ onRefresh, loading, label }: { onRefresh: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      aria-label={`Refresh ${label}`}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#222222] bg-[#1a1a1a] px-3 sm:px-4 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-orange-500/30 hover:bg-[#222222] hover:text-orange-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-[#333333] border-t-orange-500 rounded-full animate-spin" />
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );
}

export default function Trackr() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const { data: attendanceApiData, isPending: attendanceLoading, isError: attendanceError, refetch: refetchAttendance, isFetching: attendanceFetching } = useAttendance();
  const { data: marksApiData, isPending: marksLoading, isError: marksError, refetch: refetchMarks, isFetching: marksFetching } = useMarks();
  const { data: userInfo } = useUserInfo();
  
  const [activeTab, setActiveTab] = useState('attendance')
  const [isPredictionPanelOpen, setIsPredictionPanelOpen] = useState(false)
  const [selectedLeaveDates, setSelectedLeaveDates] = useState<Date[]>([])

  const getDateKey = useCallback((date: Date) => {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    return normalizedDate.getTime()
  }, [])

  const normalizeDayOrder = useCallback((dayOrder: string | null | undefined) => {
    const dayOrderRaw = String(dayOrder || '').trim()
    if (!dayOrderRaw || dayOrderRaw === '-') return null

    return dayOrderRaw.toLowerCase().startsWith('day')
      ? `Day ${dayOrderRaw.replace(/day\s*/i, '').trim()}`
      : `Day ${dayOrderRaw}`
  }, [])

  const parseMonthLabelToDate = useCallback((monthLabel: string) => {
    const monthsShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    const match = String(monthLabel || '').trim().match(/^([A-Za-z]{3})\s*'\s*(\d{2})$/)
    if (!match) return null

    const monthIndex = monthsShort.findIndex((month) => month.toLowerCase() === match[1].toLowerCase())
    if (monthIndex === -1) return null

    const year = 2000 + Number(match[2])
    if (Number.isNaN(year)) return null

    return new Date(year, monthIndex, 1)
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!router.isReady) return

    const tabParam = router.query.tab
    const normalizedTab = Array.isArray(tabParam) ? tabParam[0] : tabParam

    if (normalizedTab === 'attendance' || normalizedTab === 'marks') {
      setActiveTab(normalizedTab)
    }
  }, [router.isReady, router.query.tab])

  const shouldLoadPredictionData = isClient && activeTab === 'attendance' && (isPredictionPanelOpen || selectedLeaveDates.length > 0)
  const { data: calendarData, isPending: calendarLoading, isError: calendarError } = useCalendar({ enabled: shouldLoadPredictionData });
  const { data: timetableData, isPending: timetableLoading, isError: timetableError } = useTimetable({ enabled: shouldLoadPredictionData });
  
  // Extract batch year from registration number or use batch field
  // Batch 25 has active portal, batches 24/23/22 have closed portal
  const getBatchYear = () => {
    if (userInfo?.batch) {
      // If batch field exists, parse it (e.g., "2025" or "25")
      const batchStr = String(userInfo.batch);
      const match = batchStr.match(/(\d{2})$/); // Get last 2 digits
      return match ? parseInt(match[1]) : null;
    }
    if (!userInfo?.regNumber) return null;
    // SRM reg format: RA + 2 digit year + ...
    const regNo = String(userInfo.regNumber);
    const match = regNo.match(/RA(\d{2})/);
    return match ? parseInt(match[1]) : null;
  };
  
  const batchYear = getBatchYear();
  // Batch 25 = active portal, older batches = closed portal
  const isPortalClosed = batchYear !== null && batchYear < 25;
  
  // Attendance data is available for all years/batches
  // No unavailability check needed - all students can view their attendance
  const isNonFirstYear = false

  // Memoized data transformation functions
  const transformAttendanceData = useCallback((apiData: any[]) => {
    if (!apiData) return []
    
    // Detect closed portal: check if the backend flagged the portal as closed
    const isClosedPortalFromData = apiData.some(item => item.isClosedPortal === true);
    
    return apiData.map(item => {
      // When portal is closed and absent=0:
      // - courseConducted contains the ACTUAL percentage (e.g., 78, 98, 96)
      // - courseAttendance is wrongly calculated as 100.00
      // WORKAROUND: Use courseConducted as the percentage for closed portals
      
      let percentage: number | null = null;
      
      if (isClosedPortalFromData && item.courseAbsent === 0) {
        // Closed portal: use courseConducted as the percentage
        percentage = item.courseConducted;
      } else {
        // Normal case: parse courseAttendance string
        const raw = String(item.courseAttendance ?? '').trim();
        const parsed = parseFloat(raw.replace('%', ''));
        percentage = Number.isNaN(parsed) ? null : parsed;
      }
      
      // Attendance data is only available for 1st year students; hide for others
      const isUnavailable = isNonFirstYear;
      
      // For closed portals, do NOT show detailed breakdown
      const hasDetailedData = 
        !isClosedPortalFromData &&
        item.courseConducted !== undefined && 
        item.courseConducted !== null && 
        item.courseConducted > 0 &&
        item.courseAbsent !== undefined && 
        item.courseAbsent !== null &&
        item.courseAbsent >= 0;
      
      // Calculate detailed values only if backend provides them AND portal is open
      let total: number | null = null;
      let absent: number | null = null;
      let present: number | null = null;
      let margin = 0;
      
      if (hasDetailedData && !isUnavailable) {
        total = item.courseConducted;
        absent = item.courseAbsent;
        present = (total ?? 0) - (absent ?? 0);
        // Maximum number of classes that can still be missed while staying at/above 75%
        margin = percentage !== null ? Math.max(0, Math.floor(((present) - 0.75 * (total ?? 0)) / 0.75)) : 0;
      }
      
      return {
        subject: item.courseTitle,
        code: item.courseCode,
        type: item.courseCategory.trim().toLowerCase() === 'theory' ? 'Theory' : 'Practical',
        total: total,
        present: present,
        absent: absent,
        percentage: isUnavailable ? null : percentage,
        status: isUnavailable ? 'unavailable' : (percentage !== null && percentage >= 75 ? 'Good' : 'Warning'),
        margin: margin,
        isUnavailable: isUnavailable,
        hasDetailedData: hasDetailedData && !isUnavailable,
        isClosedPortal: isClosedPortalFromData && !isUnavailable
      }
    })
  }, [isNonFirstYear])

  const transformMarksData = useCallback((apiData: any[], attendanceData: any[]) => {
    if (!apiData) return []
    
    return apiData.map(item => {
      // Get course title from attendance data if available
      const attendanceCourse = attendanceData?.find(a => a.courseCode === item.course)
      const totalMarks = item.marks.reduce((sum: number, mark: any) => sum + mark.obtained, 0)
      const maxMarks = item.marks.reduce((sum: number, mark: any) => sum + mark.maxMark, 0)
      
      const components = item.marks.map((mark: any) => ({
        name: mark.exam || mark.examType || mark.type || 'Assessment',
        obtained: mark.obtained,
        maxMark: mark.maxMark
      }))
      
      return {
        subject: attendanceCourse?.courseTitle || item.course,
        code: item.course,
        type: item.category.trim().toLowerCase() === 'theory' ? 'Theory' : 'Practical',
        unit1: item.marks[0]?.obtained || 0,
        unit2: item.marks[1]?.obtained || 0, 
        unit3: item.marks[2]?.obtained || 0,
        totalMarks: totalMarks,
        maxMarks: maxMarks,
        components: components
      }
    })
  }, [])

  // Memoized transformed data
  const attendanceData = useMemo(() => 
    attendanceApiData ? transformAttendanceData(attendanceApiData) : []
  , [attendanceApiData, transformAttendanceData])

  const marksData = useMemo(() => 
    marksApiData ? transformMarksData(marksApiData, attendanceApiData || []) : []
  , [marksApiData, attendanceApiData, transformMarksData])

  const selectedLeaveDateKeys = useMemo(() => {
    const normalized = selectedLeaveDates.map((date) => getDateKey(date))

    return Array.from(new Set(normalized)).sort((a, b) => a - b)
  }, [selectedLeaveDates, getDateKey])

  const predictionDisabledDateKeys = useMemo(() => {
    const blockedDateKeys = new Set<number>()

    if (!calendarData || !timetableData) {
      return blockedDateKeys
    }

    const dayOrderHasClassMap = new Map<string, boolean>()

    for (const daySchedule of timetableData) {
      const normalizedDayOrder = normalizeDayOrder(daySchedule?.dayOrder)
      if (!normalizedDayOrder) continue

      const hasClass = Array.isArray(daySchedule.class)
        ? daySchedule.class.some((slot: any) => Boolean(slot?.isClass && slot?.courseCode))
        : false

      dayOrderHasClassMap.set(normalizedDayOrder.toLowerCase(), hasClass)
    }

    for (const monthData of calendarData) {
      const monthDate = parseMonthLabelToDate(monthData?.month)
      if (!monthDate) continue

      for (const day of monthData.days || []) {
        const dayOfMonth = Number(day?.date)
        if (!Number.isFinite(dayOfMonth) || dayOfMonth <= 0) continue

        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayOfMonth)
        const eventLabel = String(day?.event || '').trim()
        const isDeclaredHoliday = /\bholiday\b/i.test(eventLabel)

        const normalizedDayOrder = normalizeDayOrder(day?.dayOrder)
        const hasClasses = normalizedDayOrder
          ? dayOrderHasClassMap.get(normalizedDayOrder.toLowerCase()) === true
          : false

        if (isDeclaredHoliday || !hasClasses) {
          blockedDateKeys.add(getDateKey(currentDate))
        }
      }
    }

    return blockedDateKeys
  }, [calendarData, timetableData, normalizeDayOrder, parseMonthLabelToDate, getDateKey])

  const todayDateKey = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  }, [])

  const isPredictionDateDisabled = useCallback((date: Date) => {
    const dateKey = getDateKey(date)
    return dateKey < todayDateKey || predictionDisabledDateKeys.has(dateKey)
  }, [getDateKey, todayDateKey, predictionDisabledDateKeys])

  useEffect(() => {
    if (selectedLeaveDates.length === 0 || predictionDisabledDateKeys.size === 0) {
      return
    }

    setSelectedLeaveDates((prev) => {
      const filtered = prev.filter((date) => !predictionDisabledDateKeys.has(getDateKey(date)))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [predictionDisabledDateKeys, selectedLeaveDates.length, getDateKey])

  const predictionEnabled = selectedLeaveDateKeys.length > 0

  const predictionContext = useMemo(() => {
    const impactByCourseCode = new Map<string, number>()

    if (!calendarData || !timetableData || selectedLeaveDateKeys.length === 0) {
      return {
        impactByCourseCode,
        mappedDays: 0,
        unmappedDays: selectedLeaveDateKeys.length,
      }
    }

    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    let mappedDays = 0

    for (const dateKey of selectedLeaveDateKeys) {
      const selectedDate = new Date(dateKey)
      const monthLabel = `${monthsShort[selectedDate.getMonth()]} '${String(selectedDate.getFullYear()).slice(-2)}`
      const monthData = calendarData.find((month: any) => month.month === monthLabel)
      if (!monthData) continue

      const dayData = monthData.days.find((day: any) => Number(day.date) === selectedDate.getDate())
      const normalizedDayOrder = normalizeDayOrder(dayData?.dayOrder)
      if (!normalizedDayOrder) continue

      const daySchedule = timetableData.find(
        (entry: any) => String(entry.dayOrder || '').toLowerCase() === normalizedDayOrder.toLowerCase()
      )

      if (!daySchedule || !Array.isArray(daySchedule.class)) continue

      mappedDays += 1

      for (const slot of daySchedule.class) {
        if (!slot?.isClass || !slot?.courseCode) continue
        impactByCourseCode.set(slot.courseCode, (impactByCourseCode.get(slot.courseCode) || 0) + 1)
      }
    }

    return {
      impactByCourseCode,
      mappedDays,
      unmappedDays: Math.max(0, selectedLeaveDateKeys.length - mappedDays),
    }
  }, [calendarData, timetableData, selectedLeaveDateKeys, normalizeDayOrder])

  const displayedAttendanceData = useMemo(() => {
    if (!predictionEnabled) {
      return attendanceData.map((item: any) => ({
        ...item,
        predictedLeaveClasses: 0,
      }))
    }

    return attendanceData.map((item: any) => {
      const predictedLeaveClasses = predictionContext.impactByCourseCode.get(item.code) || 0

      if (
        item.isUnavailable ||
        item.isClosedPortal ||
        !item.hasDetailedData ||
        predictedLeaveClasses === 0
      ) {
        return {
          ...item,
          predictedLeaveClasses,
        }
      }
    // 👇 NEW LOGIC (add future attended days)

  const today = new Date()
   today.setHours(0, 0, 0, 0)

  const firstLeaveDate = selectedLeaveDateKeys.length > 0 
  ? new Date(selectedLeaveDateKeys[0]) 
  : null

  let futureDaysCount = 0

  if (firstLeaveDate) {
  const temp = new Date(today)
  while (temp < firstLeaveDate) {
    futureDaysCount++
    temp.setDate(temp.getDate() + 1)
    }
  }

    // 👇 apply future attendance first
    const present = (item.present ?? 0) + futureDaysCount
    const totalBeforeLeave = (item.total ?? 0) + futureDaysCount

    // 👇 then apply leave
    const total = totalBeforeLeave + predictedLeaveClasses
     const absent = (item.absent ?? 0) + predictedLeaveClasses
     // const present = item.present ?? 0
     // const total = (item.total ?? 0) + predictedLeaveClasses
     // const absent = (item.absent ?? 0) + predictedLeaveClasses
      const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : item.percentage
      const margin = Math.max(0, Math.floor((present - 0.75 * total) / 0.75))

      return {
        ...item,
        total,
        absent,
        present,
        percentage,
        status: percentage !== null && percentage >= 75 ? 'Good' : 'Warning',
        margin,
        predictedLeaveClasses,
      }
    })
  }, [attendanceData, predictionContext, predictionEnabled])

  // Helper to format marks to 2 decimal places always
  const formatMark = (v: number | string | undefined | null) => {
    const n = Number(v ?? 0)
    if (Number.isNaN(n)) return '0.00'
    return n.toFixed(2)
  }

  // Check if any data is still loading
  const isLoading = attendanceLoading || marksLoading;
  
  // Check if there are any errors
  const hasError = attendanceError || marksError;

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full text-white min-h-screen">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Trackr</h1>
            <p className="text-gray-400">Loading your academic data...</p>
          </div>
        </div>
        <div className="flex h-96 w-full justify-center items-center">
          <div className="text-center">
            <p className="text-gray-400">Fetching your academic data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="w-full text-white min-h-screen">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Trackr</h1>
            <p className="text-red-400">Failed to load academic data</p>
          </div>
        </div>
      </div>
    )
  }

  // Show no data message
  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="w-full text-white min-h-screen">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Trackr</h1>
            <p className="text-gray-400">Track your attendance & marks.</p>
          </div>
        </div>
        <div className="flex h-64 w-full justify-center items-center">
          <div className="text-gray-400">No academic data found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Trackr</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              <a
                href="https://wa.me/919336843008?text=Hi%2C%20I%20found%20an%20issue%20in%20Trackr%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
              >
                Report issues via WhatsApp
              </a>
            </p>
          </div>
          <div className="w-full sm:w-auto bg-[#111111] rounded-xl p-2 border border-[#222222]">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`text-xs sm:text-sm py-2 px-3 rounded-md font-medium transition-all duration-200 h-10 flex items-center justify-center ${
                  activeTab === 'attendance'
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                }`}
              >
                <span className="truncate" title="Attendance">
                  Attendance
                </span>
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`text-xs sm:text-sm py-2 rounded-md px-3 font-medium transition-all duration-200 h-10 flex items-center justify-center ${
                  activeTab === 'marks'
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                }`}
              >
                <span className="truncate" title="Marks">
                  Marks
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {activeTab === 'attendance' ? (
            <div>
              <div className="mb-4 sm:mb-6 bg-[#1a1a1a] border border-[#222222] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Predictr
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 max-w-md">
                      Interactive attendance forecasting. See how future absences will affect your required classes.
                    </p>
                  </div>
                  <div className="flex items-center sm:gap-3 shrink-0">
                    <button
                      onClick={() => setIsPredictionPanelOpen((prev) => !prev)}
                      className={`text-sm py-2 px-5 rounded-xl font-semibold transition-all duration-300 h-10 flex items-center justify-center shadow-lg transform active:scale-95 w-full sm:w-auto ${
                        isPredictionPanelOpen
                          ? 'bg-[#111111] text-gray-300 border border-[#333333] hover:bg-[#222222]'
                          : 'bg-orange-500 text-white border border-transparent hover:bg-orange-600 shadow-orange-500/20'
                      }`}
                    >
                      {isPredictionPanelOpen ? 'Hide Predictr' : 'Launch Predictr'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isPredictionPanelOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-5 border-t border-[#222222] flex flex-col xl:flex-row gap-5 sm:gap-6">
                        
                        {/* Calendar Section */}
                        <div className="flex-1 max-w-full xl:max-w-[420px]">
                          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 shadow-inner h-full flex flex-col items-center">
                            {calendarLoading || timetableLoading ? (
                              <div className="flex flex-col items-center justify-center space-y-4 py-12 flex-1 w-full">
                                <div className="w-8 h-8 border-4 border-[#222222] border-t-orange-500 rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-gray-400">Loading resources...</span>
                              </div>
                            ) : calendarError || timetableError || !calendarData || !timetableData ? (
                              <div className="text-center py-12 px-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl flex-1 flex flex-col items-center justify-center w-full">
                                <svg className="w-8 h-8 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm font-medium text-yellow-500">Prediction calendar unavailable</span>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center w-full overflow-hidden pb-2 px-1">
                                <Calendar
                                  mode="multiple"
                                  selected={selectedLeaveDates}
                                  onSelect={(days) => setSelectedLeaveDates(days || [])}
                                  disabled={isPredictionDateDisabled}
                                  classNames={{
                                    weekdays: "flex w-full justify-between gap-1 mb-2",
                                    week: "flex w-full justify-between mt-2 gap-1",
                                    day: "relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent",
                                    selected: "!bg-transparent",
                                    today: "!bg-transparent [&>button:not([data-selected-single=true])]:!bg-[#2a2a2a] [&>button:not([data-selected-single=true])]:!text-orange-400 [&>button:is([data-selected-single=true])]:!bg-orange-500 [&>button:is([data-selected-single=true])]:!text-white",
                                    day_button: "w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 sm:w-10 sm:h-10 text-[10px] min-[380px]:text-xs sm:text-sm aspect-square p-0 font-medium !rounded-xl transition-all duration-200 hover:!bg-[#222222] data-[selected-single=true]:!bg-orange-500 data-[selected-single=true]:!text-white data-[selected-single=true]:!font-bold data-[selected-single=true]:!shadow-md data-[selected-single=true]:!shadow-orange-500/20 data-[selected-single=true]:hover:!bg-orange-600 group-data-[focused=true]/day:!ring-[2px] group-data-[focused=true]/day:!ring-offset-[#111111] group-data-[focused=true]/day:!ring-orange-500/70"
                                  }}
                                  className="border-0 bg-transparent w-full sm:max-w-[380px] p-0 scale-[0.9] min-[380px]:scale-100 origin-top"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Summary Section */}
                        <div className="flex-1 flex flex-col">
                          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 sm:p-6 shadow-inner h-full relative overflow-hidden flex flex-col">
                             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10 shrink-0">
                               <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                               </svg>
                               Impact Summary
                             </h3>

                             {predictionEnabled ? (
                               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 relative z-10">
                                 <div className="flex items-end gap-3 mb-5 bg-[#1a1a1a] border border-[#222222] p-4 rounded-xl shadow-sm">
                                   <div className="text-5xl font-black text-white leading-none tracking-tight">
                                     {selectedLeaveDateKeys.length}
                                   </div>
                                   <div className="text-sm font-semibold text-gray-400 capitalize pb-1">
                                     Selected<br/>Day{selectedLeaveDateKeys.length !== 1 && 's'}
                                   </div>
                                 </div>

                                 <div className="space-y-3 mb-6 flex-1">
                                   <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border border-[#222222] shadow-sm">
                                      <span className="text-gray-300 font-medium">Classes to be missed</span>
                                      <span className="text-orange-500 font-bold text-2xl">
                                        {Array.from(predictionContext.impactByCourseCode.values()).reduce((a, b) => a + b, 0)}
                                      </span>
                                   </div>

                                   {predictionContext.unmappedDays > 0 && (
                                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                                       <svg className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                       </svg>
                                       <span className="text-orange-200/80 text-sm font-medium leading-relaxed">
                                         {predictionContext.unmappedDays} selected day(s) have no scheduled classes or are holidays.
                                       </span>
                                     </motion.div>
                                   )}
                                 </div>

                                 <div className="mt-auto pt-2">
                                   <button
                                     onClick={() => setSelectedLeaveDates([])}
                                     className="w-full text-sm py-2.5 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center bg-[#1a1a1a] text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 active:scale-[0.98] shadow-sm"
                                   >
                                     <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                     </svg>
                                     Clear Selection
                                   </button>
                                 </div>
                               </motion.div>
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10 flex-1 opacity-60">
                                  <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm font-medium text-gray-400 max-w-[240px]">
                                    Click dates on the calendar to see how missing classes will affect your attendance.
                                  </p>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-lg font-bold text-white">Attendance</h2>
                <RefreshButton onRefresh={() => refetchAttendance()} loading={attendanceFetching} label="attendance" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedAttendanceData.map((item, index) => (
                  <motion.div
                    key={`${item.code}-${item.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-4 hover:border-[#333333] transition-all duration-300 relative"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={false}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      status={
                        item.isUnavailable
                          ? "default"
                          : item.percentage === null
                          ? "default"
                          : item.percentage > 75
                          ? "success"
                          : item.percentage === 75
                          ? "warning"
                          : "danger"
                      }
                    />
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-white">{item.code}</div>
                      <span className="px-2 py-1 bg-[#111111] text-xs text-gray-300 rounded border border-[#222222]">
                        {item.type}
                      </span>
                    </div>

                    <div className="text-center mb-3">
                      <div className="text-base font-semibold text-white leading-tight truncate" title={item.subject}>
                        {item.subject}
                      </div>
                    </div>

                    <div className="text-center mb-3">
                      <div className={`text-2xl font-bold ${
                        item.isUnavailable
                          ? 'text-gray-400'
                            : (item.percentage !== null && item.percentage > 75) 
                          ? 'text-green-400' 
                              : item.percentage === 75
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {item.isUnavailable ? 'Unavailable' : (item.percentage === null ? '—' : `${item.percentage}%`) }
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {!item.isUnavailable && item.hasDetailedData && !item.isClosedPortal && (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{item.present}</div>
                            <div className="text-sm font-medium text-gray-400">Present</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{item.absent}</div>
                            <div className="text-sm font-medium text-gray-400">Absent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{item.total}</div>
                            <div className="text-sm font-medium text-gray-400">Total</div>
                          </div>
                        </>
                      )}
                    </div>

                    {predictionEnabled && !item.isUnavailable && !item.isClosedPortal && item.hasDetailedData && (
                      <div className="text-center mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md border border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          +{item.predictedLeaveClasses || 0} missed class{(item.predictedLeaveClasses || 0) !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center">
                      {item.isUnavailable ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-sm border-2 bg-gray-400/10 text-gray-300 border-gray-400/20 inline-flex items-center justify-center text-center">
                          No attendance data available
                        </span>
                      ) : item.isClosedPortal ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-sm border-2 bg-gray-400/10 text-gray-300 border-gray-400/20 inline-flex items-center justify-center text-center">
                          {predictionEnabled ? 'Prediction unavailable - portal closed' : 'Portal closed - only % available'}
                        </span>
                      ) : item.hasDetailedData ? (
                        <span className={`px-2 py-1 text-sm font-bold rounded-sm border-2 ${
                          (item.percentage !== null && item.percentage < 75) 
                            ? 'bg-red-400/10 text-white border-red-400/20' 
                            : item.margin === 0
                              ? 'bg-yellow-400/10 text-white border-yellow-400/20'
                              : 'bg-green-400/10 text-white border-green-400/20'
                        }`}>
                          {item.percentage === null ? (
                            'No data'
                          ) : item.percentage < 75 ? (
                            // Number of attended classes (x) required to reach 75%:
                            // (present + x) / (total + x) >= 0.75  =>  x >= (0.75*total - present) / 0.25
                            `Required: ${Math.max(0, Math.ceil((0.75 * (item.total ?? 0) - (item.present ?? 0)) / 0.25))}`
                          ) : (
                            `Margin: ${item.margin}`
                          )}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-sm border-2 bg-gray-400/10 text-gray-300 border-gray-400/20 inline-flex items-center justify-center text-center">
                          Limited data available
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-lg font-bold text-white">Marks</h2>
                <RefreshButton onRefresh={() => refetchMarks()} loading={marksFetching} label="marks" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {marksData.map((item, index) => (
                  <motion.div
                    key={`${item.code}-${item.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-3 hover:border-[#333333] transition-all duration-300 relative flex flex-col h-full group"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={false}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      status={"default"}
                    />
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-white">{item.code}</div>
                      <span className="px-2 py-1 bg-[#111111] text-xs text-gray-300 rounded border border-[#222222]">
                        {item.type}
                      </span>
                    </div>

                    <div className="text-center mb-3">
                      <div className="text-base font-semibold text-white leading-tight truncate px-2" title={item.subject}>
                        {item.subject}
                      </div>
                    </div>

                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-emerald-400">
                        {formatMark(item.totalMarks)}/{formatMark(item.maxMarks)}
                      </div>
                    </div>

                    {item.components && item.components.length > 0 && (
                      <div className="space-y-1 flex-1 flex flex-col justify-start">
                        <div className={`grid gap-1 justify-center ${
                          item.components.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                        }`}>
                          {item.components.map((component: any, idx: number) => {
                            // If there's an odd number of components and this is the last one,
                            // make it span both columns so it fills the row.
                            const isLastSingle = (item.components.length % 2 === 1) && (idx === item.components.length - 1);
                            const spanClass = isLastSingle ? 'col-span-2' : 'col-span-1';
                            // No highlighting — uniform appearance for all boxes
                            const highlightClass = 'bg-[#111111] border-[#333333] text-white';

                            return (
                              <MarksComponentBox
                                key={idx}
                                component={component}
                                isFirst={false}
                                spanClass={spanClass}
                                highlightClass={highlightClass}
                                formatMark={formatMark}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}