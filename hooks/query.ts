import { useQuery } from "@tanstack/react-query";
import {
  DaySchedule,
  AttendanceDetail,
  MarkDetail,
  UserInfo,
  CourseDetail,
  Month,
} from "srm-academia-api";

// Client-side TTL cache (backed by localStorage via the app's persister).
// Data is served from cache until the TTL (staleTime) expires; only then is a
// fresh server scrape triggered on mount. An explicit "Refresh" action calls
// refetch(), which bypasses staleTime and always scrapes. These TTIs are the
// primary lever for reducing serverless edge/function invocations on the free
// tiers: most repeat visits read cache instead of hitting the server.
const BASE = 1000; // ms

// Store session ID globally to prevent regeneration on every render
let globalSessionId: string | null = null;

// Helper function to get a persistent session identifier
const getSessionId = () => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  if (!globalSessionId) {
    let sessionId = sessionStorage.getItem('studique-session-id');
    if (!sessionId) {
      sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('studique-session-id', sessionId);
    }
    globalSessionId = sessionId;
  }
  
  return globalSessionId;
};

export const CACHE_TTL = {
  timetable: 48 * 60 * 60 * BASE, // 48h - weekly schedule
  attendance: 6 * 60 * 60 * BASE, // 6h - updates periodically
  marks: 24 * 60 * 60 * BASE,     // 24h - changes rarely
  calendar: 24 * 60 * 60 * BASE,  // 24h - academic calendar
  userInfo: 24 * 60 * 60 * BASE,  // 24h - static profile
  course: 24 * 60 * 60 * BASE,    // 24h - semester course list
} as const;

export function useTimetable(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
  const response = await fetch('/api/timetable', { credentials: 'include' });
  const { parseJsonSafe } = await import('@/utils/parseResponse');
  const result = await parseJsonSafe(response);
      if (!response.ok) throw new Error(result.error || 'Failed to fetch timetable');
      if (result.data?.error) throw new Error(result.data.error);
      return result.data.timetable as DaySchedule[];
    },
    staleTime: CACHE_TTL.timetable, // served from cache within TTL
    gcTime: 1000 * 60 * 60 * 48, // Keep in cache for 48 hours
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const response = await fetch('/api/attendance', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const { parseJsonSafe } = await import('@/utils/parseResponse');
      const result = await parseJsonSafe(response);
      if (result.data?.error) throw new Error(result.data.error);
      return result.data.attendance as AttendanceDetail[];
    },
    staleTime: CACHE_TTL.attendance,
    gcTime: 1000 * 60 * 60 * 3,
    retry: 1,
  });
}

export function useMarks() {
  return useQuery({
    queryKey: ["marks"],
    queryFn: async () => {
      const response = await fetch('/api/marks', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch marks');
      const { parseJsonSafe } = await import('@/utils/parseResponse');
      const result = await parseJsonSafe(response);
      if (result.data?.error) throw new Error(result.data.error);
      return result.data.markList as MarkDetail[];
    },
    staleTime: CACHE_TTL.marks,
    gcTime: 1000 * 60 * 60 * 3,
    retry: 1,
  });
}

export function useUserInfo() {
  return useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      // If the user has been banned/logged-out due to reg number, skip network call
      if (typeof window !== 'undefined') {
        const bannedSession = sessionStorage.getItem('logged-out-banned-user')
        const bannedLocal = localStorage.getItem('logged-out-banned-user')
        if (bannedSession || bannedLocal) {
          // Return a Guest-like object to avoid network requests and downstream redirects
          return {
            name: 'Guest User',
            // keep other expected fields minimal
          } as any as UserInfo
        }
      }
      const response = await fetch('/api/userinfo', { credentials: 'include' });
      const { parseJsonSafe } = await import('@/utils/parseResponse');
      
      if (!response.ok) {
        const errorData = await parseJsonSafe(response).catch(() => ({} as any));
        // Check for session limit error
        if (errorData.sessionLimit) {
          const error: any = new Error(errorData.error);
          error.sessionLimit = true;
          error.terminationUrl = errorData.terminationUrl;
          throw error;
        }
        throw new Error(errorData?.error || 'Failed to fetch user info');
      }

      const result = await parseJsonSafe(response);
      if (result.data.error) throw new Error(result.data.error);
      return result.data.userInfo as UserInfo;
    },
    staleTime: CACHE_TTL.userInfo,
    gcTime: 1000 * 60 * 60 * 48, // Keep in cache for 48 hours
    retry: false, // Don't retry session limit errors
  });
}

export function useCourse() {
  return useQuery({
    queryKey: ["course"],
    queryFn: async () => {
      const res = await fetch("/api/course", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await res.json();

      // ✅ VERY IMPORTANT (normalize shape)
      return Array.isArray(data)
        ? data
        : data?.courseList || [];
    },
    staleTime: CACHE_TTL.course,
    retry: 1,
  });
}

export function useCalendar(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: async () => {
  const response = await fetch('/api/calendar', { credentials: 'include' });
  const { parseJsonSafe } = await import('@/utils/parseResponse');
  const result = await parseJsonSafe(response);
      if (!response.ok) throw new Error(result.error || 'Failed to fetch calendar');
      if (result.data?.error) throw new Error(result.data.error);
      return result.data.calendar as Month[];
    },
    staleTime: CACHE_TTL.calendar,
    gcTime: 1000 * 60 * 60 * 48, // Keep in cache for 48 hours
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}
