"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { useQueryClient } from "@tanstack/react-query"
import {
  FaBookOpen,
  FaFileAlt,
  FaUtensils,
  FaCalculator,
  FaChartLine,
  FaUserTie,
  FaBars,
  FaTimes,
  FaBullseye,
  FaHome,
  FaInfoCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaCalendarAlt,
  FaWhatsapp,
  FaStore,
  FaHandshake,
  FaCalendarCheck,
  FaClock,
  FaCalendar,
  FaCog,
} from "react-icons/fa"
import { useAttendance, useMarks, useUserInfo } from "@/hooks/query"

// Updated color palette for darker theme
const colors = {
  bg: "#0f0f0f",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0a0",
  accentOrange: "#ff652f",
  accentYellow: "#ffe400",
  hoverBg: "#1a1a1a",
  border: "#222222",
}

type MenuItem = {
  name: string
  icon: React.ComponentType<{ size: number }>
  key: string
  disabled?: boolean
}

type SidebarItemProps = {
  item: MenuItem
  isActive: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

// 🌀 Animated maintenance icon
const AnimatedCog: React.FC<{ size: number }> = ({ size }) => (
  <FaCog
    size={size}
    className="text-white animate-spin-slow"
    style={{
      animation: "spin-slow 3s linear infinite",
    }}
  />
)

// Add keyframes for the slow spin animation
if (typeof window !== "undefined") {
  const style = document.createElement("style")
  style.innerHTML = `
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 3s linear infinite;
    }
    /* Metallic sheen animation for active sidebar items (tuned) */
    @keyframes metallic-sheen {
      0% {
        transform: translateX(-160%) skewX(-14deg) scaleX(0.9);
        opacity: 0;
      }
      30% {
        opacity: 0.9;
      }
      55% {
        opacity: 0.7;
      }
      100% {
        transform: translateX(160%) skewX(-14deg) scaleX(1.05);
        opacity: 0;
      }
    }

    .metallic-sheen-overlay {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 20;
    }

    .metallic-sheen {
      position: absolute;
      top: -12%;
      left: -50%;
      width: 44%;
      height: 124%;
      transform: translateX(-160%) skewX(-14deg);
      /* Warm-tinted bright core with soft edges for metallic look */
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,250,240,0.9) 40%, rgba(255,255,255,0.95) 50%, rgba(255,250,240,0.8) 60%, rgba(255,255,255,0) 100%);
      filter: blur(4px);
      opacity: 0;
      mix-blend-mode: overlay;
    }

    /* Slightly faster, smoother sheen for a modern metallic effect */
    .metallic-sheen.active {
      animation: metallic-sheen 1.2s ease-in-out infinite;
      opacity: 0.9;
    }
  `
  document.head.appendChild(style)
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: FaHome, key: "dashboard" },
  { name: "Trackr", icon: FaBullseye, key: "trackr" },
  { name: "Schedule", icon: FaCalendarAlt, key: "schedule", disabled: false },
  { name: "UnitWise", icon: FaBookOpen, key: "unitwise" },
  { name: "Question Bank", icon: FaFileAlt, key: "question-bank" },
  { name: "MealMap", icon: FaUtensils, key: "mealmap" },
  { name: "Finder", icon: FaUserTie, key: "finder" },
  { name: "CalcGPA", icon: FaCalculator, key: "calcgpa" },
  { name: "Join Community", icon: FaWhatsapp, key: "community" },
  { name: "About Studique", icon: FaInfoCircle, key: "about" },
]

const publicMenuItems: MenuItem[] = [
  { name: "MealMap", icon: FaUtensils, key: "mealmap" },
  { name: "Finder", icon: FaUserTie, key: "finder" },
  { name: "CalcGPA", icon: FaCalculator, key: "calcgpa" },
  { name: "About Studique", icon: FaInfoCircle, key: "about" },
]

const publiclyAccessibleKeys = new Set([
  "mealmap",
  "finder",
  "calcgpa",
  "about",
  "community",
]);

const publiclyAccessiblePaths = new Set([
  "/mealmap",
  "/finder",
  "/calcgpa",
  "/about",
  "/auth/login",
]);

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const menuItem = item as MenuItem

  return (
    <button
      disabled={menuItem.disabled}
      className="flex items-center p-2 rounded-lg relative overflow-hidden w-full text-left group"
      aria-disabled={menuItem.disabled}
      style={{
        backgroundColor: isActive ? colors.accentOrange : isHovered ? colors.hoverBg : "transparent",
        color: menuItem.disabled ? colors.textSecondary : colors.textPrimary,
        border: isActive ? `1px solid ${colors.accentOrange}` : `1px solid transparent`,
        boxShadow: isActive ? `0 3px 10px ${colors.accentOrange}40` : 'none',
        transition: 'background-color 400ms cubic-bezier(0.4,0,0.2,1), border-color 400ms cubic-bezier(0.4,0,0.2,1), box-shadow 400ms cubic-bezier(0.4,0,0.2,1)',
        opacity: menuItem.disabled ? 0.5 : 1,
        cursor: menuItem.disabled ? 'not-allowed' : 'pointer'
      }}
      onMouseEnter={() => {
        if (menuItem.disabled) return
        setIsHovered(true)
        onMouseEnter()
      }}
      onMouseLeave={() => {
        if (menuItem.disabled) return
        setIsHovered(false)
        onMouseLeave()
      }}
      onClick={() => {
        if (!menuItem.disabled) onClick()
      }}
    >
      {/* Background gradient effect for active/hover states */}
      <div
        className="absolute inset-0"
        style={{
          background: `${colors.accentOrange}20`,
          opacity: isActive ? 0.2 : isHovered ? 0.1 : 0,
          transition: "opacity 300ms cubic-bezier(0.4,0,0.2,1)"
        }}
      />
      {/* Metallic sheen overlay for active state */}
      {isActive && !menuItem.disabled && (
        <div className="metallic-sheen-overlay" aria-hidden>
          <div className={`metallic-sheen active`} />
        </div>
      )}
      
      <div
        className="relative z-10 flex items-center justify-center"
        style={{
          color: menuItem.disabled ? colors.textSecondary : isActive ? colors.textPrimary : isHovered ? colors.accentOrange : colors.textSecondary,
          minWidth: "20px",
          maxWidth: "20px",
          transition: "color 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <item.icon size={20} />
      </div>
      
      <span
        className="ml-3 font-medium whitespace-nowrap overflow-hidden text-sm"
        style={{
          color: menuItem.disabled ? colors.textSecondary : isActive ? colors.textPrimary : isHovered ? colors.accentOrange : colors.textSecondary,
          transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {item.name}
      </span>
      
      {/* Active indicator line */}
      {isActive && !menuItem.disabled && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
          style={{ 
            backgroundColor: colors.accentOrange,
            transition: "background-color 300ms cubic-bezier(0.4,0,0.2,1)"
          }}
        />
      )}

      {menuItem.disabled && isHovered && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-orange-500/40 bg-[#0f0f0f] px-2 py-1 text-[10px] font-medium text-orange-300">
          Login to access
        </span>
      )}
    </button>
  )
}

interface DynamicSidebarProps {
  onNavigate: (page: string) => void
  currentPage: string
  onCollapseChange?: (isCollapsed: boolean) => void
  publicOnly?: boolean
  trackrDisabled?: boolean
  calcgpaPlusDisabled?: boolean
}

export default function DynamicSidebar({ onNavigate, currentPage, onCollapseChange, publicOnly = false, trackrDisabled = false, calcgpaPlusDisabled = false }: DynamicSidebarProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const hasLoggedOut = useRef(false)
  
  // Get user info to check if user is guest
  const { data: userInfo } = useUserInfo()
  const { data: attendanceApiData, isLoading: attendanceLoading } = useAttendance()
  const { data: marksApiData, isLoading: marksLoading } = useMarks()

  const hasAttendanceData = Array.isArray(attendanceApiData) && attendanceApiData.length > 0
  const hasUsableMarksData =
    Array.isArray(marksApiData) &&
    marksApiData.some((item: any) =>
      Array.isArray(item?.marks) &&
      item.marks.some((mark: any) => Number(mark?.maxMark) > 0)
    )

  const derivedTrackrDisabled = (attendanceLoading && marksLoading)
    ? true
    : (!hasAttendanceData && !hasUsableMarksData)
  const derivedCalcgpaPlusDisabled = marksLoading || !hasUsableMarksData

  const effectiveTrackrDisabled = trackrDisabled || derivedTrackrDisabled
  const effectiveCalcgpaPlusDisabled = calcgpaPlusDisabled || derivedCalcgpaPlusDisabled

  const hasAuthToken =
    typeof window !== "undefined" &&
    document.cookie.split(";").some((cookie) => cookie.trim().startsWith("token="))
  const isAuthenticated = !!userInfo && userInfo.name !== "Guest User"
  const isGuest = !isAuthenticated && !hasAuthToken
  const isPublicContext =
    publicOnly ||
    publiclyAccessibleKeys.has(currentPage) ||
    publiclyAccessiblePaths.has(router.pathname)
  const menuItemsWithAvailability = menuItems.map((item) => ({
    ...item,
    disabled:
      item.disabled ||
      (item.key === "trackr" && effectiveTrackrDisabled) ||
      (item.key === "calcgpa-plus" && effectiveCalcgpaPlusDisabled),
  }))
  const guestMenuItems = menuItemsWithAvailability.map((item) => ({
    ...item,
    disabled: item.disabled || !publiclyAccessibleKeys.has(item.key),
  }))
  const visibleMenuItems = publicOnly
    ? publicMenuItems
    : isGuest && isPublicContext
      ? guestMenuItems
      : menuItemsWithAvailability
  const sidebarBgColor = publicOnly ? "rgba(18, 20, 24, 0.96)" : colors.bg
  const sidebarBorderColor = publicOnly ? "rgba(255, 101, 47, 0.18)" : colors.border

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleNavigation = (key: string) => {
    if (key === "community") {
      // Open WhatsApp community link in new tab
      window.open("https://chat.whatsapp.com/FMZWuDow9GeA0Og8tm3rGm", "_blank", "noopener,noreferrer")
    } else {
      onNavigate(key)
    }
  }

  const handleAuthAction = async () => {
    if (isGuest) {
      // Navigate to login page
      window.location.href = "/auth/login"
    } else {
      // Logout process
      setIsLoggingOut(true)
      try {
        // Call logout API directly first
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        // Clear session storage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('studique-session-id');
        }
        // Clear all React Query cache to prevent stale data
        queryClient.clear()
        window.location.href = "/auth/login"
      } catch (error) {
        // logout error intentionally ignored to avoid noisy logs in production
        window.location.href = "/auth/login"
      }
    }
  }

  // Check if user should be logged out immediately based on registration number
  useEffect(() => {
    // Don't run on login page or if already logged out this session
    if (router.pathname === '/auth/login' || hasLoggedOut.current) {
      return
    }

    // Check if we've already logged out this user in this session
    if (typeof window !== 'undefined') {
      const isBannedSession = sessionStorage.getItem('logged-out-banned-user')
      const isBannedLocal = localStorage.getItem('logged-out-banned-user')
      if (isBannedSession || isBannedLocal) {
        return
      }
    }

    if (userInfo && !isGuest) {
      let regNumber = null
      
      try {
        // Try to call regNumber as a function first (as mentioned by user)
        if (typeof (userInfo as any).regNumber === 'function') {
          regNumber = (userInfo as any).regNumber()
        }
      } catch (error) {
        // ignore regNumber function errors silently
      }
      
      // If function call failed, try to access as property
      if (!regNumber) {
        const userInfoAny = userInfo as any
        regNumber = userInfoAny.regNumber || userInfoAny.registrationNumber || userInfoAny.regno || userInfoAny.reg_number
      }
      
      const bannedRegs = ['RA2311026010346', 'RA2311028010030']
      if (regNumber && bannedRegs.includes(String(regNumber))) {
        // Set flag to prevent repeated logout attempts
        hasLoggedOut.current = true
        
        // Set both session and local storage flags to prevent logout loop
        if (typeof window !== 'undefined') {
          const timestamp = Date.now().toString()
          sessionStorage.setItem('logged-out-banned-user', 'true')
          sessionStorage.setItem('logged-out-banned-user-time', timestamp)
          localStorage.setItem('logged-out-banned-user', 'true')
          localStorage.setItem('logged-out-banned-user-time', timestamp)
        }
        
        // Immediately logout this specific user without logging to console
        handleAuthAction()
      }
    }
  }, [userInfo, isGuest, router.pathname])
  
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Studique - Student Companion Platform',
        text: 'Check out Studique for attendance tracking, notes, mess menu and more!',
        url: 'https://studique.in/'
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers without Web Share API
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Website link copied to clipboard!');
      }
    } catch (error) {
      // ignore share errors silently
    }
  };

  if (!isMounted) {
    return (
      <>
        {/* Desktop Skeleton */}
        <div
          className="hidden lg:flex flex-col h-screen fixed top-0 left-0 z-40 animate-pulse"
          style={{ 
            backgroundColor: colors.bg,
            width: '220px',
          }}
        >
          <div className="flex-1 py-4 px-2 space-y-1">
            {[...Array(visibleMenuItems.length)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="p-2 border-t flex justify-center" style={{ borderColor: colors.border }}>
            <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
          </div>
        </div>
        {/* Mobile Skeleton */}
        <div className="lg:hidden">
          <div
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg flex items-center justify-center animate-pulse"
            style={{
              backgroundColor: colors.accentOrange,
              width: "48px",
              height: "48px",
            }}
          >
             <div className="w-6 h-6 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop Sidebar - More compact */}
      <div
        className="hidden lg:flex flex-col h-screen fixed top-0 left-0 z-40"
        style={{ 
          backgroundColor: sidebarBgColor,
          backdropFilter: publicOnly ? "blur(6px)" : "none",
          width: '220px',
          borderRight: `1px solid ${sidebarBorderColor}`,
          boxShadow: publicOnly ? "0 0 28px rgba(0, 0, 0, 0.35)" : "none",
          transitionProperty: 'width, opacity',
          transitionDuration: '500ms',
          transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
          willChange: 'width'
        }}
      >
        <nav className="flex-1 py-4 px-2 overflow-y-auto relative space-y-1">
          {visibleMenuItems.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              isActive={currentPage === item.key}
              onClick={() => handleNavigation(item.key)}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
            />
          ))}
        </nav>

        {/* Share and Logout/Login Buttons - Compact */}
        {!publicOnly && (
        <div className="p-2 border-t space-y-1" style={{ borderColor: colors.border }}>
          {/* Share Button */}
          {/* Share button removed per request */}

          {/* Logout/Login Button */}
          <button
            onClick={handleAuthAction}
            disabled={isLoggingOut}
            className="flex items-center p-2 rounded-lg relative overflow-hidden w-full text-left group"
            style={{
              backgroundColor: isLoggingOut ? colors.hoverBg : "transparent",
              color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
              border: `1px solid ${isLoggingOut ? colors.border : "transparent"}`,
              transition: "background-color 400ms cubic-bezier(0.4,0,0.2,1), color 400ms cubic-bezier(0.4,0,0.2,1), border-color 400ms cubic-bezier(0.4,0,0.2,1)",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.backgroundColor = colors.hoverBg;
                e.currentTarget.style.color = colors.accentOrange;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = colors.accentOrange;
              }
            }}
            aria-label={isGuest ? "Login" : "Logout"}
          >
            <div
              className="relative z-10 flex items-center justify-center"
              style={{
                color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
                minWidth: "20px",
                maxWidth: "20px",
                transition: "color 300ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {isGuest ? <FaSignInAlt size={20} /> : <FaSignOutAlt size={20} />}
            </div>
            <span
              className="ml-3 font-medium whitespace-nowrap overflow-hidden text-sm"
              style={{
                color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
                transition: "color 300ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {isLoggingOut ? "Processing..." : isGuest ? "Login" : "Logout"}
            </span>
          </button>
        </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg flex items-center justify-center"
          style={{
            backgroundColor: colors.accentOrange,
            width: "56px",
            height: "56px",
            boxShadow: "0 4px 20px rgba(255, 101, 47, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.backgroundColor = colors.accentOrange
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.backgroundColor = colors.accentOrange
          }}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? (
            <FaTimes size={24} color="white" />
          ) : (
            <FaBars size={24} color="white" />
          )}
        </button>
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black z-40 opacity-70"
              onClick={() => setIsMobileOpen(false)}
            />
            <div
              className="fixed bottom-24 right-6 w-64 p-4 rounded-xl shadow-2xl z-50 flex flex-col transition-all duration-300"
              style={{
                backgroundColor: sidebarBgColor,
                border: `1px solid ${sidebarBorderColor}`,
                backdropFilter: publicOnly ? "blur(6px)" : "none",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              }}
            >
              {visibleMenuItems.map((item, index) => (
                <SidebarItem
                  key={index}
                  item={item}
                  isActive={currentPage === item.key}
                  onClick={() => {
                    handleNavigation(item.key)
                    setIsMobileOpen(false)
                  }}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                />
              ))}

              {!publicOnly && (
              <div className="mt-2 pt-3 border-t space-y-1" style={{ borderColor: colors.border }}>
                {/* Mobile Logout Button */}
                <button
                  onClick={() => {
                    handleAuthAction()
                    setIsMobileOpen(false)
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center p-2 rounded-lg relative overflow-hidden w-full text-left group"
                  style={{
                    backgroundColor: isLoggingOut ? colors.hoverBg : "transparent",
                    color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
                    border: `1px solid ${isLoggingOut ? colors.border : "transparent"}`,
                    transition: "background-color 400ms cubic-bezier(0.4,0,0.2,1), color 400ms cubic-bezier(0.4,0,0.2,1), border-color 400ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoggingOut) {
                      e.currentTarget.style.backgroundColor = colors.hoverBg;
                      e.currentTarget.style.color = colors.accentOrange;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoggingOut) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = colors.accentOrange;
                    }
                  }}
                  aria-label={isGuest ? "Login" : "Logout"}
                >
                  <div
                    className="relative z-10 flex items-center justify-center"
                    style={{
                      color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
                      minWidth: "18px",
                      maxWidth: "18px",
                      transition: "color 300ms cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {isGuest ? <FaSignInAlt size={14} /> : <FaSignOutAlt size={14} />}
                  </div>
                  <span
                    className="ml-3 font-medium whitespace-nowrap overflow-hidden text-sm"
                    style={{
                      color: isLoggingOut ? colors.textSecondary : colors.accentOrange,
                      transition: "color 300ms cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {isLoggingOut ? "Processing..." : isGuest ? "Login" : "Logout"}
                  </span>
                </button>
              </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}