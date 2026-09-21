import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Minus, Plus, Calendar, Download, RefreshCw } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useCalendar, useTimetable } from "@/hooks/query";
import { GlobalLoader } from "../loader";
import { isCurrentClass } from "@/utils/currentClass";
import { getIndex } from "@/utils/currentMonth";
import { DaySchedule } from "srm-academia-api";

interface ScheduleProps {
  autoDownload?: boolean;
}

function Schedule({ autoDownload = false }: ScheduleProps) {
  const {
    data: timetableData,
    isPending: timetableLoading,
    isError: timetableError,
    refetch: refetchTimetable,
    isFetching: timetableFetching,
  } = useTimetable();
  const {
    data: calendarData,
    isPending: calendarLoading,
    isError: calendarError,
  } = useCalendar();

  const [dayOrder, setDayOrder] = useState<number>(0);
  const [today, setToday] = useState<number>();
  const [plannerMonth, setPlannerMonth] = useState<number>(0);
  const hasAutoDownloadedRef = useRef(false);
  const currentRef = useRef<HTMLDivElement>(null);
  const plannerCurrentRef = useRef<HTMLDivElement>(null);
  const dailyScheduleRef = useRef<HTMLDivElement>(null);

  // Get all available days including holidays for navigation
  const getAllDaysForNavigation = useCallback(() => {
    if (!calendarData) return [];

    return calendarData.flatMap((monthObj: any) =>
      monthObj.days.map((day: any) => ({
        ...day,
        month: monthObj.month,
      })),
    );
  }, [calendarData]);

  const getTodayCalendarInfo = useCallback(() => {
    if (!calendarData) return null;

    
    const now = new Date();
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
    ];
    const formattedMonth = `${monthsShort[now.getMonth()]} '${String(
      now.getFullYear(),
    ).slice(-2)}`;
    const monthObj = calendarData.find((m: any) => m.month === formattedMonth);

    if (monthObj) {
      const todayDate = String(now.getDate());
      const todayDay = monthObj.days.find((d: any) => d.date === todayDate);
      return todayDay ? { ...todayDay, month: formattedMonth } : null;
    }
    return null;
  }, [calendarData]);

  const navigationDays = useMemo(() => {
    return getAllDaysForNavigation();
  }, [getAllDaysForNavigation]);

  // Determine if we have calendar data - MUST be declared before being used in useMemo
  const hasCalendarData = calendarData && calendarData.length > 0;

  const currentDayClasses = useMemo(() => {
    if (!timetableData) return [];

    let classes: any[] = [];

    if (hasCalendarData) {
      // Calendar-based navigation
      if (!navigationDays[dayOrder]) return [];

      const currentDayInfo = navigationDays[dayOrder];

      if (currentDayInfo.dayOrder === "-") {
        return [];
      }

      const dayOrderNumber = parseInt(currentDayInfo.dayOrder);
      if (
        !isNaN(dayOrderNumber) &&
        dayOrderNumber > 0 &&
        timetableData[dayOrderNumber - 1]
      ) {
        const daySchedule = timetableData[dayOrderNumber - 1];
        classes =
          daySchedule?.class?.filter((item: any) => item.isClass === true) ||
          [];
      }
    } else {
      // Simple day-based navigation (no calendar)
      if (dayOrder >= 0 && dayOrder < timetableData.length) {
        const daySchedule = timetableData[dayOrder];
        classes =
          daySchedule?.class?.filter((item: any) => item.isClass === true) ||
          [];
      }
    }

    // Sort classes by time
    return classes.sort((a, b) => {
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const start = timeStr.split(" - ")[0].trim();
        const m = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (m) {
          let h = parseInt(m[1], 10);
          const min = parseInt(m[2], 10);
          const mer = (m[3] || "").toUpperCase();
          if (mer === "PM" && h !== 12) h += 12;
          if (mer === "AM" && h === 12) h = 0;
          return h * 60 + min;
        }
        return 0;
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  }, [timetableData, navigationDays, dayOrder, hasCalendarData]);

  const getCurrentSelectedDayInfo = useCallback(() => {
    if (!navigationDays || navigationDays.length === 0) return null;

    if (dayOrder >= 0 && dayOrder < navigationDays.length) {
      return navigationDays[dayOrder];
    }

    return null;
  }, [navigationDays, dayOrder]);

  const isLoading = timetableLoading || calendarLoading;
  const hasError = timetableError;

  useEffect(() => {
    if (hasCalendarData && navigationDays && navigationDays.length > 0) {
      const todayInfo = getTodayCalendarInfo();

      if (todayInfo) {
        const todayIndex = navigationDays.findIndex(
          (day: any) =>
            day.date === todayInfo.date &&
            day.day === todayInfo.day &&
            day.month === todayInfo.month,
        );

        if (todayIndex !== -1) {
          setToday(todayIndex);
          setDayOrder(todayIndex);
        } else {
          setToday(0);
          setDayOrder(0);
        }
      } else {
        setToday(0);
        setDayOrder(0);
      }
    } else if (!hasCalendarData && timetableData) {
      // When no calendar data, default to day 0 (Day 1 in timetable)
      setToday(0);
      setDayOrder(0);
    }
  }, [navigationDays, getTodayCalendarInfo, hasCalendarData, timetableData]);

  useEffect(() => {
    if (calendarData && calendarData.length > 0) {
      const currentMonthIndex = getIndex({ data: calendarData });
      setPlannerMonth(currentMonthIndex);
    }
  }, [calendarData]);

  const smoothScrollToElement = useCallback((element: HTMLElement) => {
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, []);

  const handleCardClick = (item: any) => {
    const dayIndex = navigationDays.findIndex(
      (navDay: any) => navDay.date === item.date && navDay.day === item.day,
    );

    if (dayIndex !== -1) {
      setDayOrder(dayIndex);

      // Scroll to daily schedule section with delay to allow state update
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (dailyScheduleRef.current) {
            smoothScrollToElement(dailyScheduleRef.current);
          }
        }, 150);
      });
    }
  };

  const getDayType = (dayInfo: any) => {
    if (!dayInfo) return "holiday";

    // Check if dayOrder exists and is not "-"
    if (dayInfo.dayOrder && dayInfo.dayOrder !== "-") {
      return "working";
    }

    // Check if it's a weekend
    if (dayInfo.day) {
      const dayLower = dayInfo.day.toLowerCase();
      if (dayLower.includes("sat") || dayLower.includes("sun")) {
        return "weekend";
      }
    }

    // Otherwise it's a holiday
    return "holiday";
  };

  const downloadWeeklyTimetable = useCallback(() => {
    if (!timetableData || timetableData.length === 0) return;

    // Helper to check if slot is lab
    const isLabSlot = (cls: any) => {
      const slot = (cls.slot || "").toUpperCase();
      return slot.startsWith("P") && /P\d+/.test(slot);
    };
    // For PNG: do not shorten subject, use two-line subject with truncation, and show room number on third line
    const getSubjectLines = (cls, maxWidth, fontSize) => {
      const title = (cls.courseTitle || "").trim();
      // Truncate to two lines max, add ellipsis if needed
      const charWidthRatio = 0.6;
      const maxCharsPerLine = Math.floor(
        maxWidth / (fontSize * charWidthRatio),
      );
      let words = title.split(" ");
      let lines: string[] = [];
      let currentLine = "";
      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > maxCharsPerLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);
      if (lines.length > 2) {
        lines = [lines[0], lines[1].slice(0, maxCharsPerLine - 3) + "..."];
      }
      // Add room number as third line if available
      if (cls.courseRoomNo) {
        lines.push(`Room: ${cls.courseRoomNo}`);
      }
      return lines;
    };

    // Helper to wrap text dynamically for multi-line display
    const wrapText = (
      text: string,
      maxWidth: number,
      fontSize: number,
    ): string[] => {
      // Approximate character width ratio for Arial font
      const charWidthRatio = 0.6;
      const maxCharsPerLine = Math.floor(
        maxWidth / (fontSize * charWidthRatio),
      );

      // Handle very narrow boxes
      if (maxCharsPerLine < 5) {
        return [text.substring(0, 3) + ".."];
      }

      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        // If single word is too long, break it
        if (word.length > maxCharsPerLine) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }
          // Break long word into chunks
          for (let i = 0; i < word.length; i += maxCharsPerLine - 1) {
            lines.push(
              word.substring(i, i + maxCharsPerLine - 1) +
                (i + maxCharsPerLine - 1 < word.length ? "-" : ""),
            );
          }
        } else if (testLine.length <= maxCharsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });

      if (currentLine) lines.push(currentLine);

      // Limit to max 3 lines to fit in box height
      if (lines.length > 3) {
        lines.splice(2, lines.length - 2);
        lines[2] = lines[2].substring(0, maxCharsPerLine - 3) + "...";
      }

      return lines;
    };

    // Helper to get unique key for subject (base subject + lab/theory)
    const getSubjectKey = (cls: any) => {
      const title = (cls.courseTitle || "").trim();
      const isLab = isLabSlot(cls);
      return `${title}_${isLab ? "lab" : "theory"}`;
    };

    // Collect all unique time slots
    const timeSlots: string[] = [];
    const timeSlotSet = new Set<string>();

    timetableData.forEach((day: any) => {
      const classes = (day?.class || []).filter((c: any) => c.isClass);
      classes.forEach((cls: any) => {
        if (cls.time && !timeSlotSet.has(cls.time)) {
          timeSlotSet.add(cls.time);
          timeSlots.push(cls.time);
        }
      });
    });

    // Sort time slots chronologically
    timeSlots.sort((a, b) => {
      const parseTime = (timeStr: string) => {
        const start = timeStr.split(" - ")[0].trim();
        const m = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (m) {
          let h = parseInt(m[1], 10);
          const min = parseInt(m[2], 10);
          const mer = (m[3] || "").toUpperCase();
          if (mer === "PM" && h !== 12) h += 12;
          if (mer === "AM" && h === 12) h = 0;
          return h * 60 + min;
        }
        let [hours, minutes] = start.split(":").map(Number);
        if (isNaN(hours)) hours = 0;
        if (isNaN(minutes)) minutes = 0;
        if (hours < 8 && hours !== 0) hours += 12;
        return hours * 60 + minutes;
      };
      return parseTime(a) - parseTime(b);
    });

    const numDays = Math.min(timetableData.length, 5);
    const numSlots = timeSlots.length;

    const padding = 30;
    const headerHeight = 36;
    const dayLabelWidth = 86;
    const slotWidth = 130;
    const rowHeight = 70;

    const width = padding * 2 + dayLabelWidth + slotWidth * numSlots;
    const height = padding * 2 + headerHeight + rowHeight * numDays;
    const brandingBarHeight = 42;
    const exportHeight = height + brandingBarHeight;

    // Use only dark palette for timetable PNG
    const bg = "#181A1B";
    const emptyCellBg = "#1f4d2e";
    const practicalCellBg = "#63dd66";
    const theoryCellBg = "#f3d96a";
    const headerBg = "#141922";
    const dayBg = "#141922";
    const gridLine = "#262d39";
    const textDark = "#d9dee7";
    const textLight = "#aeb6c4";

    let svgContent = `<rect fill="${bg}" width="${width}" height="${height}"/>`;

    const gridStartY = padding;
    const gridStartX = padding + dayLabelWidth;

    svgContent += `<rect x="${padding}" y="${gridStartY}" width="${width - 2 * padding}" height="${headerHeight}" fill="${headerBg}"/>`;

    svgContent += `<rect x="${padding}" y="${gridStartY}" width="${dayLabelWidth}" height="${headerHeight}" fill="${headerBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
    svgContent += `<text x="${padding + dayLabelWidth / 2}" y="${gridStartY + headerHeight / 2 + 4}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" letter-spacing="0.4" fill="${textLight}">DAY</text>`;

    timeSlots.forEach((slot, i) => {
      const x = gridStartX + i * slotWidth;
      svgContent += `<rect x="${x}" y="${gridStartY}" width="${slotWidth}" height="${headerHeight}" fill="${headerBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
      const timeParts = slot.split(" - ");
      const timeText = timeParts.length > 0 ? timeParts[0] : slot;
      svgContent += `<text x="${x + slotWidth / 2}" y="${gridStartY + headerHeight / 2 + 4}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="10.5" font-weight="600" letter-spacing="0.3" fill="${textLight}">${timeText}</text>`;
    });

    for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
      const day = timetableData[dayIdx];
      const classes = (day?.class || []).filter((c: any) => c.isClass);
      const rowY = gridStartY + headerHeight + dayIdx * rowHeight;

      svgContent += `<rect x="${padding}" y="${rowY}" width="${dayLabelWidth}" height="${rowHeight}" fill="${dayBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
      svgContent += `<text x="${padding + dayLabelWidth / 2}" y="${rowY + rowHeight / 2 + 4}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="0.2" fill="${textDark}">Day ${dayIdx + 1}</text>`;

      const processedSlots = new Set<number>();

      timeSlots.forEach((slot, slotIdx) => {
        if (processedSlots.has(slotIdx)) return;

        const x = gridStartX + slotIdx * slotWidth;

        const cls = classes.find((c: any) => c.time === slot);
        if (cls) {
          const subjectKey = getSubjectKey(cls);
          const bgColor = isLabSlot(cls) ? practicalCellBg : theoryCellBg;

          let mergeCount = 1;
          for (let i = slotIdx + 1; i < timeSlots.length; i++) {
            const nextCls = classes.find((c: any) => c.time === timeSlots[i]);
            if (nextCls && getSubjectKey(nextCls) === subjectKey) {
              mergeCount++;
              processedSlots.add(i);
            } else {
              break;
            }
          }

          const mergedWidth = slotWidth * mergeCount;
          svgContent += `<rect x="${x}" y="${rowY}" width="${mergedWidth}" height="${rowHeight}" fill="${bgColor}" stroke="#2a303a" stroke-width="1.2"/>`;

          // Wrap subject to two lines, truncate, and show room number as third line
          const boxPadding = 8;
          const availableWidth = mergedWidth - boxPadding * 2;
          const fontSize = 12;
          const lines = getSubjectLines(cls, availableWidth, fontSize);
          const lineHeight = fontSize + 2;
          const totalTextHeight = lines.length * lineHeight;
          const startY = rowY + (rowHeight - totalTextHeight) / 2 + fontSize;
          const subjectTextColor = "#0d1f12";
          const roomTextColor = "#21412b";
          lines.forEach((line, idx) => {
            const lineY = startY + idx * lineHeight;
            svgContent += `<text x="${x + mergedWidth / 2}" y="${lineY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${idx === 2 ? 10 : fontSize}" font-weight="${idx === 2 ? 500 : 700}" fill="${idx === 2 ? roomTextColor : subjectTextColor}">${line}</text>`;
          });
        } else {
          svgContent += `<rect x="${x}" y="${rowY}" width="${slotWidth}" height="${rowHeight}" fill="${emptyCellBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
        }
      });
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${svgContent}
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const SCALE = 4; // Highest possible quality for export
      const canvas = document.createElement("canvas");
      canvas.width = width * SCALE;
      canvas.height = exportHeight * SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const exportPng = () => {
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = "weekly-timetable.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
        }, "image/png");
      };

      const drawBrandingBar = (logoImage?: HTMLImageElement) => {
        const barY = height;

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, barY, width, brandingBarHeight);

        ctx.strokeStyle = "#d9d9d9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, barY + 0.5);
        ctx.lineTo(width, barY + 0.5);
        ctx.stroke();

        const logoSize = 20;
        const text = "studique.in";
        ctx.font = "700 16px Arial";
        const textWidth = ctx.measureText(text).width;
        const rightPadding = 16;
        const gap = 8;
        const textX = width - rightPadding - textWidth;
        const logoX = textX - gap - logoSize;
        const logoY = barY + (brandingBarHeight - logoSize) / 2;

        if (logoImage) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
          ctx.restore();
        }

        ctx.fillStyle = "#111111";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, textX, barY + brandingBarHeight / 2 + 0.5);
        ctx.restore();
      };

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.scale(SCALE, SCALE);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        drawBrandingBar(logo);
        exportPng();
      };
      logo.onerror = () => {
        drawBrandingBar();
        exportPng();
      };
      logo.src = "/images/pnglogo.png";
    };
    img.src = url;
  }, [timetableData]);

  useEffect(() => {
    if (!autoDownload) return;
    if (hasAutoDownloadedRef.current) return;
    if (timetableLoading || !timetableData || timetableData.length === 0) return;

    hasAutoDownloadedRef.current = true;
    downloadWeeklyTimetable();
  }, [autoDownload, timetableLoading, timetableData, downloadWeeklyTimetable]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
            Schedule
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Loading your schedule...
          </p>
        </div>
        <div className="flex h-96 w-full justify-center items-center">
          <div className="text-center">
            <p className="text-gray-400">Fetching your schedule data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
            Schedule
          </h1>
          <p className="text-red-400 text-sm sm:text-base">
            Failed to load schedule data
          </p>
        </div>
      </div>
    );
  }

  const isViewingToday = today !== undefined && dayOrder === today;
  const selectedDayInfo = hasCalendarData ? getCurrentSelectedDayInfo() : null;
  const canGoPrevious = dayOrder > 0;

  const currentDayType = hasCalendarData
    ? getDayType(selectedDayInfo)
    : "working";
  const isWorkingDay = hasCalendarData ? currentDayType === "working" : true;

  // Helper to check if a class is a lab based on slot
  const isLabClass = (item: any) => {
    const slot = (item.slot || "").toUpperCase();
    return slot.startsWith("P") && /P\d+/.test(slot);
  };

  // Helper to get display name for a class (adds "Lab" suffix for lab classes)
  const getClassDisplayName = (item: any) => {
    const title = item.courseTitle || "";
    return isLabClass(item) ? `${title} Lab` : title;
  };

  const getDayDisplayName = (dayInfo: any) => {
    if (!hasCalendarData) {
      // Simple day display without calendar
      return timetableData?.[dayOrder]?.dayOrder || `Day ${dayOrder + 1}`;
    }

    if (!dayInfo) return "Loading...";

    if (dayInfo.dayOrder === "-") {
      const dayType = getDayType(dayInfo);
      return dayType === "weekend" ? "Weekend" : "Holiday";
    } else {
      return `Day ${dayInfo.dayOrder}`;
    }
  };

  const todayDate = new Date().getDate();
  const currentMonth = getIndex({ data: calendarData || [] });

  const filteredDays = calendarData?.[plannerMonth]?.days || [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
              Schedule
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              View your daily schedule and academic planner
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Daily Schedule Section */}
          <div ref={dailyScheduleRef} className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Daily Schedule
              </h2>

              <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex justify-center sm:justify-end flex-1 sm:flex-initial">
                  <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-[#222222] p-1 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (canGoPrevious) {
                          setDayOrder((prev) => prev - 1);
                        }
                      }}
                      disabled={!canGoPrevious}
                      className="p-3 rounded-lg hover:enabled:bg-orange-500 hover:enabled:border-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Minus className="w-5 h-5 text-gray-300 group-hover:enabled:text-white transition-colors" />
                    </button>

                    <div
                      className={`px-8 py-2 text-lg font-bold flex-1 sm:min-w-[220px] text-center rounded-lg mx-1 ${
                        isViewingToday ? "text-orange-400" : "text-white"
                      }`}
                    >
                      {getDayDisplayName(selectedDayInfo)}
                    </div>

                    <button
                      onClick={() => {
                        const maxDays = hasCalendarData
                          ? navigationDays.length
                          : timetableData?.length || 0;
                        if (dayOrder < maxDays - 1) {
                          setDayOrder((prev) => prev + 1);
                        }
                      }}
                      disabled={
                        dayOrder >=
                        (hasCalendarData
                          ? navigationDays.length
                          : timetableData?.length || 0) -
                          1
                      }
                      className="p-3 rounded-lg hover:enabled:bg-orange-500 hover:enabled:border-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Plus className="w-5 h-5 text-gray-300 group-hover:enabled:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={downloadWeeklyTimetable}
                    className="bg-[#1a1a1a] rounded-xl border border-[#222222] p-1 hover:bg-orange-500 transition-all duration-300 group"
                  >
                    <div className="p-3 rounded-lg">
                      <Download className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                </div>

                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={() => refetchTimetable()}
                    disabled={timetableFetching}
                    aria-label="Refresh timetable"
                    className="bg-[#1a1a1a] rounded-xl border border-[#222222] p-1 hover:bg-orange-500 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-3 rounded-lg">
                      <RefreshCw
                        className={`w-5 h-5 text-gray-300 group-hover:text-white transition-colors ${
                          timetableFetching ? "animate-spin text-orange-500" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule Content */}
            {(() => {
              if (hasCalendarData && !selectedDayInfo) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Loading Schedule
                    </h3>
                    <p className="text-gray-400">
                      Please wait while we load the schedule...
                    </p>
                  </div>
                );
              }

              if (hasCalendarData && !isWorkingDay) {
                return (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-semibold text-red-400">
                        {currentDayType === "weekend" ? "Weekend" : "Holiday"}
                        {isViewingToday ? " Today!" : ""}
                      </h3>
                    </div>
                    {selectedDayInfo && selectedDayInfo.event && (
                      <p className="text-gray-400 text-sm mt-2">
                        {selectedDayInfo.event}
                      </p>
                    )}
                  </div>
                );
              }

              if (currentDayClasses.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {getDayDisplayName(selectedDayInfo)} - No Classes
                    </h3>
                    <p className="text-gray-400">
                      No classes scheduled for{" "}
                      {getDayDisplayName(selectedDayInfo).toLowerCase()}.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {currentDayClasses.map((item: any, index: number) => {
                    return (
                      <motion.div
                        key={`${item.courseCode}-${item.time}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative rounded-2xl p-3 sm:p-4 transition-all duration-300 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/45 hover:border-orange-400/70 cursor-pointer flex flex-col min-w-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                          <div className="text-xs font-semibold text-gray-100 min-w-0 truncate">
                            {item.courseCode}
                          </div>
                          <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-orange-500/10 text-orange-200 border border-orange-500/40 whitespace-nowrap flex-shrink-0 max-w-full overflow-hidden text-ellipsis">
                            {item.time}
                          </span>
                        </div>

                        <div className="mb-3 flex-1">
                          <div
                            className="text-base sm:text-lg font-bold text-white leading-tight"
                            title={getClassDisplayName(item)}
                          >
                            {getClassDisplayName(item)}
                          </div>
                        </div>

                        {item.courseRoomNo && (
                          <div>
                            <div className="text-xs text-gray-300">
                              Room: {item.courseRoomNo}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Academic Planner Section - Only show if calendar data is available */}
          {hasCalendarData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Academic Planner
                </h2>

                <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                  <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-[#222222] p-1 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (plannerMonth > 0) {
                          setPlannerMonth(plannerMonth - 1);
                        }
                      }}
                      disabled={plannerMonth <= 0}
                      className="p-3 rounded-lg hover:enabled:bg-orange-500 hover:enabled:border-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Minus className="w-5 h-5 text-gray-300 group-hover:enabled:text-white transition-colors" />
                    </button>
                    <div
                      className={`px-8 py-2 text-lg font-bold flex-1 sm:min-w-[220px] text-center rounded-lg mx-1 ${
                        plannerMonth === currentMonth
                          ? "text-orange-400"
                          : "text-white"
                      }`}
                    >
                      {calendarData?.[plannerMonth]?.month || "Loading..."}
                    </div>
                    <button
                      onClick={() => {
                        if (plannerMonth < (calendarData?.length || 0) - 1) {
                          setPlannerMonth(plannerMonth + 1);
                        }
                      }}
                      disabled={plannerMonth >= (calendarData?.length || 0) - 1}
                      className="p-3 rounded-lg hover:enabled:bg-orange-500 hover:enabled:border-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Plus className="w-5 h-5 text-gray-300 group-hover:enabled:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              </div>

              {filteredDays.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDays.map((item: any, index: number) => {
                    const dayType = getDayType(item);
                    const isCurrent =
                      item.date === todayDate.toString() &&
                      plannerMonth === currentMonth;
                    const isWorking = dayType === "working";
                    const isHoliday =
                      dayType === "holiday" || dayType === "weekend";

                    return (
                      <motion.div
                        key={`${item.date}-${item.day}`}
                        ref={isCurrent ? plannerCurrentRef : undefined}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleCardClick(item)}
                        className={`relative h-[128px] w-full rounded-2xl p-4 transition-all duration-300 border overflow-hidden min-w-0 ${
                          isCurrent
                            ? "bg-gradient-to-br from-[#18120b] via-[#120e0a] to-[#0d0b09] border-orange-500/70"
                            : isHoliday
                              ? "bg-gradient-to-br from-[#161111] via-[#111010] to-[#0c0c0c] border-orange-400/55"
                              : "bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border-orange-500/55"
                        } ${isWorking ? "cursor-pointer hover:border-orange-400/70" : "cursor-default"}`}
                      >
                        <GlowingEffect
                          spread={40}
                          glow={isWorking || isHoliday}
                          disabled={isCurrent}
                          proximity={64}
                          inactiveZone={0.01}
                          status={
                            isCurrent
                              ? "warning"
                              : isWorking
                                ? "success"
                                : "danger"
                          }
                        />

                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`text-sm font-semibold ${
                                isCurrent ? "text-orange-400" : "text-white"
                              }`}
                            >
                              {item.date}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                                isHoliday
                                  ? 'bg-orange-300/10 text-orange-200 border-orange-300/35'
                                  : 'bg-orange-500/10 text-orange-200 border-orange-500/35'
                              }`}
                            >
                              {item.day}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col items-start justify-center gap-1">
                            <div
                              className={`text-sm uppercase tracking-wide ${isHoliday ? "text-red-400" : "text-gray-400"}`}
                            >
                              {isHoliday
                                ? dayType === "weekend"
                                  ? "Off Day"
                                  : "Holiday"
                                : "Working Day"}
                            </div>
                            {isHoliday ? (
                              <div className="text-base font-semibold text-red-300 leading-tight line-clamp-2">
                                {item.event?.trim() ||
                                  (dayType === "weekend"
                                    ? "Weekend"
                                    : "Holiday")}
                              </div>
                            ) : (
                              <div className="text-lg font-bold text-white leading-tight">
                                Day {item.dayOrder}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No upcoming days
                  </h3>
                  <p className="text-gray-400">
                    All days in this month have passed.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
export default Schedule;
