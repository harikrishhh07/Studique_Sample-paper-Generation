"use client";

import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import {
  FaBookOpen,
  FaFileAlt,
  FaUtensils,
  FaCalculator,
  FaChartLine,
  FaUserTie,
  FaBullseye,
  FaCalendarAlt,
  FaDownload,
  FaStore,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaWhatsapp,
  FaInfoCircle,
  FaShareAlt,
} from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import Background from "@/components/ui/background";
import { HoverEffect, Card } from "@/components/ui/card-hover-effect";
import { useUserInfo, useCourse, useAttendance, useMarks, useTimetable } from "@/hooks/query";
import dashboardBannerConfig from "@/lib/data/BannerConfig.json";
import { CouponModal } from "@/components/CouponModal";
import { useState, useEffect, useCallback, useRef } from "react";

// Static announcement data (kept deterministic for SSR/CSR parity)
const ANNOUNCEMENT_ITEMS: Array<{
  id: string;
  kind: 'unitwise' | 'join' | 'share' | 'generic';
  head: string;
  tail?: string;
  message?: string;
}> = [
    {
      id: 'resources',
      kind: 'unitwise',
      head: 'Access 100+ subjects',
      tail: 'with notes, PYQs, and YouTube playlists in UnitWise!',
    },
    {
      id: 'trackr',
      kind: 'generic',
      head: 'Track your attendance & marks',
      tail: 'with Trackr - stay on top of your academics!',
    },
    {
      id: 'join',
      kind: 'join',
      head: 'Join our team!',
      tail: 'Help build Studique - tap to connect via WhatsApp.',
      message:
        "Hi Studique team! I'm interested in contributing to Studique. Please let me know how I can help.",
    },
    {
      id: 'share',
      kind: 'share',
      head: 'Share Studique with your classmates and',
      tail: 'help more students succeed',
    },
  ];

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface FeaturedItem {
  id: string;
  type: "event" | "listing";
  title: string;
  description: string;
  imageUrl: string;
  date?: string;
  category?: string;
  link: string;
  sellerEmail?: string;
  sellerWhatsApp?: string;
  sellerName?: string;
  eventLink?: string;
}

const DASHBOARD_BANNER_POPUP_SESSION_KEY = "dashboard-curr-banner-popup-shown";
const ENABLE_DASHBOARD_BANNER_POPUP = false;

interface DashboardBannerConfig {
  showPopUp: boolean;
  description: string;
  bannerAriaLabel: string;
  popupCtaAriaLabel: string;
  bannerImageAlt: string;
  popupImageAlt: string;
  url: string;
  imageSrc: string;
  isClickable?: boolean;
  action?: string;
}

const bannerConfigs: DashboardBannerConfig[] = Array.isArray(dashboardBannerConfig)
  ? (dashboardBannerConfig as DashboardBannerConfig[])
  : [dashboardBannerConfig as DashboardBannerConfig];

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data: userInfo, isLoading: userLoading, error: userError } = useUserInfo();
  const [isSigningOutExpiredSession, setIsSigningOutExpiredSession] = useState(false);
  const [showCurrBannerPopup, setShowCurrBannerPopup] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-play banner carousel every 5 seconds
  useEffect(() => {
    if (bannerConfigs.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerConfigs.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const forceLogoutToLogin = useCallback(async () => {
    if (isSigningOutExpiredSession) {
      return;
    }

    setIsSigningOutExpiredSession(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      // Ignore logout API errors and continue redirect.
    } finally {
      window.location.href = '/auth/login?session=expired';
    }
  }, [isSigningOutExpiredSession]);

  useEffect(() => {
    if (
      userError &&
      typeof userError === 'object' &&
      'sessionLimit' in userError &&
      (userError as any).sessionLimit
    ) {
      forceLogoutToLogin();
    }
  }, [userError, forceLogoutToLogin]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentBanner = bannerConfigs[currentBannerIndex] || bannerConfigs[0];
    const alreadyShown = sessionStorage.getItem(DASHBOARD_BANNER_POPUP_SESSION_KEY);
    if (!alreadyShown && ENABLE_DASHBOARD_BANNER_POPUP && currentBanner?.showPopUp) {
      sessionStorage.setItem(DASHBOARD_BANNER_POPUP_SESSION_KEY, "1");
      setShowCurrBannerPopup(true);
    }
  }, [currentBannerIndex]);

  const { data: courseData, isLoading: courseLoading } = useCourse();
  const { data: attendanceApiData, isLoading: attendanceLoading, refetch: refetchAttendance, isFetching: attendanceFetching } = useAttendance();
  const { data: marksApiData, isLoading: marksLoading } = useMarks();
  const { data: timetableData, isLoading: timetableLoading } = useTimetable();

  const getInsights = useCallback(() => {
    let totalAttendance = "0%";
    let attColor = "text-white";
    let totalMarksStr = "0 / 0";
    let totalMarksObtainedStr = "0";
    let totalMarksMaxStr = "0";
    let marksColor = "text-white";
    let hasAttendanceData = false;
    let hasMarksData = false;

    if (attendanceApiData && Array.isArray(attendanceApiData) && attendanceApiData.length > 0) {
      hasAttendanceData = true;
      let sumConducted = 0;
      let sumPresent = 0;
      let validSubjects = 0;

      const isClosedPortal = attendanceApiData.some(item => item.isClosedPortal === true);

      let percentageVal = 0;
      if (isClosedPortal) {
        const sumPercentages = attendanceApiData.reduce((acc, item) => acc + (item.courseConducted || 0), 0);
        percentageVal = sumPercentages / attendanceApiData.length;
      } else {
        attendanceApiData.forEach((item) => {
          const conducted = item.courseConducted || 0;
          const absent = item.courseAbsent || 0;
          if (conducted > 0) {
            sumConducted += conducted;
            sumPresent += (conducted - absent);
            validSubjects++;
          }
        });
        if (validSubjects > 0 && sumConducted > 0) {
          percentageVal = (sumPresent / sumConducted) * 100;
        }
      }

      if (percentageVal > 0) {
        totalAttendance = percentageVal.toFixed(2) + "%";
        if (percentageVal > 75) attColor = "text-green-400";
        else if (percentageVal === 75) attColor = "text-yellow-400";
        else attColor = "text-red-400";
      }
    }

    if (marksApiData && Array.isArray(marksApiData) && marksApiData.length > 0) {
      let sumObtained = 0;
      let sumMax = 0;
      marksApiData.forEach(item => {
        if (item.marks && Array.isArray(item.marks)) {
          item.marks.forEach((m: any) => {
            sumObtained += (Number(m.obtained) || 0);
            sumMax += (Number(m.maxMark) || 0);
          });
        }
      });
      if (sumMax > 0) {
        totalMarksStr = `${sumObtained.toFixed(1)}/${sumMax.toFixed(1)}`;
        totalMarksObtainedStr = sumObtained.toFixed(1);
        totalMarksMaxStr = sumMax.toFixed(1);
        hasMarksData = true;
        const p = (sumObtained / sumMax) * 100;
        if (p >= 90) marksColor = "text-green-400";
        else if (p >= 75) marksColor = "text-yellow-400";
        else if (p < 50) marksColor = "text-red-400";
      }
    }

    return { totalAttendance, totalMarksStr, totalMarksObtainedStr, totalMarksMaxStr, attColor, marksColor, hasAttendanceData, hasMarksData };
  }, [attendanceApiData, marksApiData]);

  const { totalAttendance, totalMarksStr, totalMarksObtainedStr, totalMarksMaxStr, attColor, marksColor, hasAttendanceData, hasMarksData } = getInsights();
  const calcgpaPlusDisabled = !hasMarksData;
  const trackrDisabled = !hasAttendanceData && !hasMarksData;

  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const getUserFirstName = () => {
    if (userLoading || !userInfo?.name) return "Student";
    const rawFirst = String(userInfo.name).trim().split(" ")[0] || "Student";
    if (!rawFirst) return "Student";
    return rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
  };

  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const firstName = getUserFirstName();

    if (hour < 12) {
      return `Good morning, ${firstName}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}!`;
    } else {
      return `Good evening, ${firstName}!`;
    }
  };

  const getMotivationalText = () => {
    return {
      mobile: "Attendance, GPA, timetables & notes",
      desktop:
        "Attendance, GPA & timetables, mess menus, notes, and community - your campus companion",
    };
  };

  const handleNavigation = (key: string) => {
    onNavigate(key);
  };

  const handleCommunityRedirect = () => {
    window.open("https://chat.whatsapp.com/FMZWuDow9GeA0Og8tm3rGm", "_blank");
  };

  const closeCurrBannerPopup = () => {
    setShowCurrBannerPopup(false);
  };

  const openCurrBannerPopupLink = () => {
    const currentBanner = bannerConfigs[currentBannerIndex] || bannerConfigs[0];
    if (currentBanner && currentBanner.isClickable !== false) {
      window.open(currentBanner.url, "_blank", "noopener,noreferrer");
    }
    closeCurrBannerPopup();
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: "Studique - Student Companion Platform",
        text: "Check out Studique for attendance tracking, notes, mess menu and more!",
        url: "https://studique.in/",
      };

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Website link copied to clipboard!");
      } else {
        window.prompt("Copy the link below:", `${shareData.text} ${shareData.url}`);
      }
    } catch (error) {
      console.debug("share failed", error);
    }
  };

  const handleDownloadTimetable = useCallback(() => {
    if (timetableLoading) {
      alert("Timetable is still loading. Please try again in a moment.");
      return;
    }

    if (!timetableData || timetableData.length === 0) {
      alert("Timetable is not available yet.");
      return;
    }

    const isLabSlot = (cls: any) => {
      const slot = (cls?.slot || "").toUpperCase();
      return slot.startsWith("P") && /P\d+/.test(slot);
    };

    const getSubjectLines = (cls: any, maxWidth: number, fontSize: number) => {
      const title = (cls?.courseTitle || "").trim();
      const charWidthRatio = 0.6;
      const maxCharsPerLine = Math.floor(maxWidth / (fontSize * charWidthRatio));

      const words = title.split(" ");
      let lines: string[] = [];
      let currentLine = "";

      words.forEach((word: string) => {
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
      if (cls?.courseRoomNo) {
        lines.push(`Room: ${cls.courseRoomNo}`);
      }

      return lines;
    };

    const timeSlots: string[] = [];
    const timeSlotSet = new Set<string>();

    timetableData.forEach((day: any) => {
      const classes = (day?.class || []).filter((c: any) => c?.isClass);
      classes.forEach((cls: any) => {
        if (cls?.time && !timeSlotSet.has(cls.time)) {
          timeSlotSet.add(cls.time);
          timeSlots.push(cls.time);
        }
      });
    });

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
      const classes = (day?.class || []).filter((c: any) => c?.isClass);
      const rowY = gridStartY + headerHeight + dayIdx * rowHeight;

      svgContent += `<rect x="${padding}" y="${rowY}" width="${dayLabelWidth}" height="${rowHeight}" fill="${dayBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
      svgContent += `<text x="${padding + dayLabelWidth / 2}" y="${rowY + rowHeight / 2 + 4}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="0.2" fill="${textDark}">Day ${dayIdx + 1}</text>`;

      const processedSlots = new Set<number>();

      timeSlots.forEach((slot, slotIdx) => {
        if (processedSlots.has(slotIdx)) return;

        const x = gridStartX + slotIdx * slotWidth;
        const cls = classes.find((c: any) => c?.time === slot);

        if (cls) {
          const isLab = isLabSlot(cls);
          const bgColor = isLab ? practicalCellBg : theoryCellBg;

          let mergeCount = 1;
          for (let i = slotIdx + 1; i < timeSlots.length; i++) {
            const nextCls = classes.find((c: any) => c?.time === timeSlots[i]);
            if (nextCls && (nextCls?.courseTitle || "") === (cls?.courseTitle || "") && isLabSlot(nextCls) === isLab) {
              mergeCount++;
              processedSlots.add(i);
            } else {
              break;
            }
          }

          const mergedWidth = slotWidth * mergeCount;
          svgContent += `<rect x="${x}" y="${rowY}" width="${mergedWidth}" height="${rowHeight}" fill="${bgColor}" stroke="#2a303a" stroke-width="1.2"/>`;

          const boxPadding = 8;
          const availableWidth = mergedWidth - boxPadding * 2;
          const fontSize = 12;
          const lines = getSubjectLines(cls, availableWidth, fontSize);
          const lineHeight = fontSize + 2;
          const totalTextHeight = lines.length * lineHeight;
          const startY = rowY + (rowHeight - totalTextHeight) / 2 + fontSize;
          const subjectTextColor = "#0d1f12";
          const roomTextColor = "#21412b";

          lines.forEach((line: string, idx: number) => {
            const lineY = startY + idx * lineHeight;
            svgContent += `<text x="${x + mergedWidth / 2}" y="${lineY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${idx === 2 ? 10 : fontSize}" font-weight="${idx === 2 ? 500 : 700}" fill="${idx === 2 ? roomTextColor : subjectTextColor}">${line}</text>`;
          });
        } else {
          svgContent += `<rect x="${x}" y="${rowY}" width="${slotWidth}" height="${rowHeight}" fill="${emptyCellBg}" stroke="${gridLine}" stroke-width="1.2"/>`;
        }
      });
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n  ${svgContent}\n</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const SCALE = 4;
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
      logo.src = "/images/qrark.png";
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Failed to generate timetable image. Please try again.");
    };
    img.src = url;
  }, [timetableData, timetableLoading]);

  const announcements = ANNOUNCEMENT_ITEMS.map((item) => {
    if (item.kind === 'unitwise') {
      return {
        text: (
          <>
            <span className="font-semibold text-white">{item.head}</span>{' '}{item.tail}
          </>
        ),
        onClick: () => handleNavigation('unitwise'),
      };
    }

    if (item.kind === 'generic') {
      return {
        text: (
          <>
            <span className="font-semibold text-white">{item.head}</span>{' '}{item.tail}
          </>
        ),
        onClick: () => { },
      };
    }

    if (item.kind === 'join') {
      return {
        text: (
          <>
            <span className="font-semibold text-white">{item.head}</span>{' '}{item.tail}
          </>
        ),
        onClick: () => {
          const wa = `https://wa.me/919336843008?text=${encodeURIComponent(item.message ?? '')}`;
          if (typeof window !== 'undefined') window.open(wa, '_blank');
        },
      };
    }

    if (item.kind === 'share') {
      return {
        text: (
          <>
            {item.head}{' '}
            <span className="font-semibold text-white">{item.tail}</span>
          </>
        ),
        onClick: handleShare,
      };
    }

    return {
      text: item.head,
      onClick: () => { },
    };
  });

  const featureCards = [
    {
      id: "download-timetable",
      title: "Download Timetable",
      description: "Download weekly timetable as PNG",
      longDescription: "Download your weekly timetable as a high-quality PNG image.",
      icon: FaDownload,
      onClick: handleDownloadTimetable,
      accentColor: "text-orange-400",
    },
    {
      id: "trackr",
      title: "Trackr",
      description: "Your attendance and marks together",
      longDescription: "Trackr brings your attendance and marks together.",
      icon: FaBullseye,
      onClick: () => handleNavigation("trackr"),
      disabled: trackrDisabled,
      accentColor: "text-yellow-400",
    },
    {
      id: "schedule",
      title: "Schedule",
      description: "View today's timetable",
      longDescription: "Check your daily schedule and semester calendar.",
      icon: FaCalendarAlt,
      onClick: () => handleNavigation("schedule"),
      disabled: false,
      accentColor: "text-amber-400",
    },
    {
      id: "unitwise",
      title: "UnitWise",
      description: "PPTs, PYQs, Syllabus & More",
      longDescription:
        "Find PPTs, PYQs, syllabus and even YT playlists for your subject.",
      icon: FaBookOpen,
      onClick: () => handleNavigation("unitwise"),
      accentColor: "text-orange-400",
    },
    {
      id: "question-bank",
      title: "Question Bank & Sample Paper",
      description: "AI QB & SRM Format Sample Papers",
      longDescription:
        "Upload PPT unit notes and past PYQ PDFs to generate verbatim Question Banks and SRM-format Sample Papers.",
      icon: FaFileAlt,
      onClick: () => handleNavigation("question-bank"),
      accentColor: "text-amber-400",
    },
    {
      id: "calcgpa-plus",
      title: "CalcGPA+",
      description: "Calculate grade outcomes from internals",
      longDescription:
        "Estimate required external marks and instantly see CGPA impact.",
      icon: FaChartLine,
      onClick: () => handleNavigation("calcgpa-plus"),
      disabled: calcgpaPlusDisabled,
      accentColor: "text-orange-400",
    },
    {
      id: "mealmap",
      title: "MealMap",
      description: "Check today's mess menu instantly",
      longDescription:
        "Daily mess menus for all hostels, so you always know what's cooking.",
      icon: FaUtensils,
      onClick: () => handleNavigation("mealmap"),
      accentColor: "text-green-400",
    },
    {
      id: "finder",
      title: "Finder",
      description: "Find faculty staff room instantly",
      longDescription:
        "Search for faculty by name or ID and get their staff room details.",
      icon: FaUserTie,
      onClick: () => handleNavigation("finder"),
      accentColor: "text-purple-400",
    },
    {
      id: "calcgpa",
      title: "CalcGPA",
      description: "Calculate SGPA & CGPA easily",
      longDescription:
        "Calculate your SGPA, CGPA or predict grades in seconds.",
      icon: FaCalculator,
      onClick: () => handleNavigation("calcgpa"),
      accentColor: "text-blue-400",
    },
    {
      id: "community",
      title: "Join Community",
      description: "Connect with community & get updates",
      longDescription:
        "Join our WhatsApp community to discuss and share resources.",
      icon: FaWhatsapp,
      onClick: () => handleCommunityRedirect(),
      accentColor: "text-blue-400",
    },
    {
      id: "about",
      title: "About",
      description: "About Studique",
      longDescription:
        "Know about Studique's features and the team building the Studique.",
      icon: FaInfoCircle,
      onClick: () => handleNavigation("about"),
      accentColor: "text-indigo-400",
    },
  ];

  const currentPopupBanner = bannerConfigs[currentBannerIndex] || bannerConfigs[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Liquid Announcement Banner */}
      <div
        className="w-full sticky top-0 z-40 border-b border-[rgba(255,255,255,0.15)] transition-all duration-300 pointer-events-auto"
        style={{
          backgroundColor: "rgba(17, 17, 17, 0.65)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
          transform: "translateZ(0)"
        }}
      >
        <div className="h-10 sm:h-11 flex items-center justify-center relative overflow-hidden">
          <div
            className="marquee-wrapper w-full relative h-full flex items-center"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)"
            }}
          >
            <div className="marquee-track flex items-center h-full">
              {announcements.map((item, i) => (
                <span
                  key={i}
                  className="marquee-item text-[12px] sm:text-sm tracking-wide cursor-pointer text-gray-300 hover:text-[#ff652f] transition-colors duration-300 font-medium px-4 sm:px-6"
                  onClick={item.onClick}
                >
                  {item.text}
                </span>
              ))}
              {announcements.map((item, i) => (
                <span
                  key={`dup-${i}`}
                  className="marquee-item text-[12px] sm:text-sm tracking-wide cursor-pointer text-gray-300 hover:text-[#ff652f] transition-colors duration-300 font-medium px-4 sm:px-6"
                  onClick={item.onClick}
                >
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 flex relative">
        <Background />
        <motion.div
          className="relative z-10 w-full flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8">
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 space-y-3 md:space-y-4 lg:space-y-6">
              {/* Greeting Header */}
              <motion.div className="flex items-start sm:items-center justify-between gap-3 sm:gap-6 w-full pb-2 md:pb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 leading-tight text-white">
                    <span className="relative inline-block whitespace-nowrap" suppressHydrationWarning>
                      {getGreeting()}
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-gray-300 font-medium tracking-wide whitespace-nowrap" suppressHydrationWarning>
                    <span className="md:hidden">{getMotivationalText().mobile}</span>
                    <span className="hidden md:inline">{getMotivationalText().desktop}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-200 hover:bg-orange-600 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold"
                  aria-label="Share Studique website"
                >
                  <FaShareAlt className="h-4 w-4" />
                  <span className="hidden sm:inline">Share Studique</span>
                </button>
                <a
                  href="https://play.google.com/store/apps/details?id=com.studique.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get it on Google Play"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-700 bg-black text-white transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-900 sm:h-auto sm:w-auto rounded-none lg:rounded-full sm:px-4 sm:py-2.5 sm:gap-3"
                >
                  <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.13 1.25C2.8 1.45 2.5 1.95 2.5 2.5v19c0 .55.3 1.05.63 1.25l10.36-10.36L3.13 1.25z" fill="#00f0ff" />
                    <path d="M16.89 15.14l-3.4-3.4-10.36 10.36c.35.37.91.43 1.4.16l12.36-7.12z" fill="#30ff52" />
                    <path d="M21.14 10.97l-3.25-1.87-3.4 3.4 3.4 3.4 3.25-1.87c.7-.4 1.11-1.09 1.11-1.78 0-.69-.41-1.38-1.11-1.78z" fill="#ffbb00" />
                    <path d="M16.89 8.86L4.53 1.74c-.49-.27-1.05-.21-1.4.16l10.36 10.36 3.4-3.4z" fill="#ff3b30" />
                  </svg>

                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">GET IT ON</span>
                    <span className="text-sm font-semibold tracking-tight text-white">Google Play</span>
                  </div>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {/* Banner Carousel */}
                  {bannerConfigs.length > 0 && (
                    <div className="relative md:col-span-2 lg:col-span-3 h-full min-h-45 sm:min-h-55 md:min-h-80 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.45)]">
                      <AnimatePresence mode="wait">
                        {bannerConfigs.map((banner, index) => {
                          if (index !== currentBannerIndex) return null;
                          const isCoupon = banner.action === "coupon";
                          const isClickable = banner.isClickable !== false;

                          const bannerContent = (
                            <NextImage
                              src={banner.imageSrc}
                              alt={banner.bannerImageAlt}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              style={{ objectFit: 'fill', borderRadius: 'inherit' }}
                              onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x300?text=Banner+Not+Found'; }}
                              priority={index === 0}
                            />
                          );

                          return (
                            <motion.div
                              key={banner.imageSrc + index}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 w-full h-full"
                            >
                              {isCoupon ? (
                                <button
                                  type="button"
                                  onClick={() => setShowCouponModal(true)}
                                  aria-label={banner.bannerAriaLabel}
                                  className="relative block w-full h-full text-left cursor-pointer transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_14px_40px_rgba(255,101,47,0.12)]"
                                >
                                  {bannerContent}
                                </button>
                              ) : isClickable ? (
                                <a
                                  href={banner.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={banner.bannerAriaLabel}
                                  className="relative block w-full h-full cursor-pointer transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_14px_36px_rgba(0,0,0,0.5)]"
                                >
                                  {bannerContent}
                                </a>
                              ) : (
                                <div className="relative w-full h-full">
                                  {bannerContent}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Carousel Dots */}
                      {bannerConfigs.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                          {bannerConfigs.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentBannerIndex(idx)}
                              aria-label={`Go to slide ${idx + 1}`}
                              className={`h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? "w-6 bg-orange-500" : "w-2 bg-white/40 hover:bg-white/70"
                                }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-4 lg:gap-6 md:h-full ${bannerConfigs.length > 0
                      ? "md:col-span-1 lg:col-span-1"
                      : "md:col-span-3 lg:col-span-4"
                      }`}
                  >
                    <div className="relative block w-full min-h-30 sm:min-h-35 md:min-h-0 md:flex-1">
                      <Card
                        disabled={!hasAttendanceData}
                        onClick={() => handleNavigation('trackr?tab=attendance')}
                        frostyLevel="heavy"
                        refractionMode="vibrant"
                        elasticity="medium"
                      >
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              refetchAttendance();
                            }}
                            disabled={!hasAttendanceData || attendanceFetching}
                            aria-label="Refresh attendance"
                            className="absolute top-2 right-2 z-30 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#222222] bg-[#1a1a1a] text-gray-300 transition-all duration-200 hover:border-orange-500/30 hover:bg-[#222222] hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {attendanceFetching ? (
                              <span className="h-3.5 w-3.5 border-2 border-[#333333] border-t-orange-500 rounded-full animate-spin" />
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>

                          <div className="md:hidden flex items-center justify-between h-full w-full">
                            <div className="flex flex-col h-full justify-between">
                              <div className="mb-4 sm:mb-6">
                                <span className="text-gray-400 text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-2 whitespace-nowrap">
                                  Attendance
                                </span>
                              </div>
                              <div>
                                {attendanceLoading ? (
                                  <div className="h-8 sm:h-10 lg:h-12 w-24 bg-white/10 animate-pulse rounded-lg"></div>
                                ) : (
                                  <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight whitespace-nowrap ${attColor}`}>
                                      {totalAttendance}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="hidden sm:flex md:hidden h-10 w-10 sm:h-14 sm:w-14 rounded-full items-center justify-center bg-white/5 border border-white/10 shrink-0">
                              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                          </div>

                          <div className="hidden md:flex flex-col h-full w-full justify-between">
                            <div>
                              <span className="text-gray-400 text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-2 whitespace-nowrap">
                                Attendance
                              </span>
                            </div>

                            <div>
                              {attendanceLoading ? (
                                <div className="h-8 sm:h-10 lg:h-12 w-24 bg-white/10 animate-pulse rounded-lg"></div>
                              ) : (
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <span className={`text-[clamp(1.5rem,2.7vw,3rem)] font-black tracking-tight whitespace-nowrap ${attColor}`}>
                                    {totalAttendance}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      </Card>
                    </div>

                    <div className="relative block w-full min-h-30 sm:min-h-35 md:min-h-0 md:flex-1">
                      <Card
                        disabled={!hasMarksData}
                        onClick={() => handleNavigation('trackr?tab=marks')}
                        frostyLevel="heavy"
                        refractionMode="vibrant"
                        elasticity="medium"
                      >
                        <>
                          <div className="md:hidden flex items-center justify-between h-full w-full">
                            <div className="flex flex-col h-full justify-between">
                              <div className="mb-4 sm:mb-6">
                                <span className="text-gray-400 text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-2 whitespace-nowrap">
                                  Marks
                                </span>
                              </div>
                              <div>
                                {marksLoading ? (
                                  <div className="h-8 sm:h-10 lg:h-12 w-32 bg-white/10 animate-pulse rounded-lg"></div>
                                ) : (
                                  <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight whitespace-nowrap ${marksColor}`}>
                                      {totalMarksObtainedStr}
                                    </span>
                                    <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white/50 whitespace-nowrap">
                                      /{totalMarksMaxStr}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="hidden sm:flex md:hidden h-10 w-10 sm:h-14 sm:w-14 rounded-full items-center justify-center bg-white/5 border border-white/10 shrink-0">
                              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                          </div>

                          <div className="hidden md:flex flex-col h-full w-full justify-between">
                            <div>
                              <span className="text-gray-400 text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-2 whitespace-nowrap">
                                Marks
                              </span>
                            </div>

                            <div>
                              {marksLoading ? (
                                <div className="h-8 sm:h-10 lg:h-12 w-32 bg-white/10 animate-pulse rounded-lg"></div>
                              ) : (
                                <div className="flex items-baseline gap-1 min-w-0">
                                  <span className={`text-[clamp(1.5rem,2.6vw,2.8rem)] font-black tracking-tight whitespace-nowrap ${marksColor}`}>
                                    {totalMarksObtainedStr}
                                  </span>
                                  <span className="text-[clamp(1.15rem,2vw,2rem)] font-semibold tracking-tight text-white/50 whitespace-nowrap">
                                    /{totalMarksMaxStr}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      </Card>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="relative mt-3 md:mt-4 lg:mt-6"
              >
                <HoverEffect
                  items={featureCards}
                  className="relative z-10"
                  suppressHydrationWarning
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {ENABLE_DASHBOARD_BANNER_POPUP && currentPopupBanner?.showPopUp && showCurrBannerPopup && (
          <motion.div
            className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-white hover:bg-black/80"
                onClick={closeCurrBannerPopup}
                aria-label="Close popup"
              >
                Close
              </button>

              <button
                type="button"
                className="block w-full"
                onClick={openCurrBannerPopupLink}
                aria-label={currentPopupBanner.popupCtaAriaLabel}
              >
                <NextImage
                  src={currentPopupBanner.imageSrc}
                  alt={currentPopupBanner.popupImageAlt}
                  width={800}
                  height={300}
                  className="h-auto w-full"
                  priority
                />
              </button>

              <p className="px-4 pb-4 text-center text-sm text-gray-300">
                {currentPopupBanner.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CouponModal
        open={showCouponModal}
        onOpenChange={setShowCouponModal}
      />

      <style jsx>{`
        .marquee-wrapper {
          display: flex;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .marquee-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: marquee-scroll 45s linear infinite;
          will-change: transform;
        }

        .marquee-item {
          display: inline-block;
          color: #d1d5db;
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0 1.5rem;
          flex-shrink: 0;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 768px) {
          .marquee-track {
            animation-duration: 35s;
          }

          .marquee-item {
            font-size: 0.8125rem;
            margin: 0 1.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation-duration: 120s;
          }
        }
      `}</style>
    </div>
  );
}