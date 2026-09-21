"use server";
import "@/utils/file-polyfill";
import { redirect } from "next/navigation";
import {
  PasswordInput,
  verifyPassword,
  verifyUser,
  logoutUser,
} from "srm-academia-api";
import { fetchCourseImproved } from "@/lib/courseImproved";
import { fetchTimetableImproved } from "@/lib/timetableImproved";
import { fetchCalendarImproved } from "@/lib/calendarImproved";
//import { fetchAttendanceImproved, fetchMarksImproved } from "@/lib/attendanceMarksImproved";
import { fetchAttendanceImproved } from "@/lib/attendanceMarksImproved";
import { fetchMarksInternal } from "@/lib/attendanceMarksImproved";
import { fetchUserInfoImproved } from "@/lib/userInfoImproved";

export async function validateUser(email: string) {
  const res = await verifyUser(email);
  return { res };
}

export async function validatePassword({
  digest,
  identifier,
  password,
}: PasswordInput) {
  const res = await verifyPassword({ digest, identifier, password });
  return { res };
}

export async function getLogout(cookie: string) {
  const res = await logoutUser(cookie);
  return { res };
}

export async function timetable(cookie: string) {
  const result = await fetchTimetableImproved(cookie);
  
  if (result.error) {
    return { data: { error: result.error, status: result.status } };
  }
  
  return { data: { timetable: result.timetable, status: 200 } };
}

export async function attendance(cookie: string) {
  // Use improved scraper (handles pageSanitizer.sanitize encoding)
  const result = await fetchAttendanceImproved(cookie);
  
  if (result.error) {
    return { data: { error: result.error, status: result.status } };
  }
  
  return { data: { attendance: result.attendance, status: 200 } };
}

export async function marks(cookie: string) {
  // Use improved scraper (handles pageSanitizer.sanitize encoding)
  //const result = await fetchMarksImproved(cookie);
  const result = await fetchMarksInternal(cookie);
  if (result.error) {
    return { data: { error: result.error, status: result.status } };
  }
  
  return { data: { markList: result.markList, status: 200 } };
}

export async function Calendar(cookie: string) {
  const result = await fetchCalendarImproved(cookie);
  
  if (result.error) {
    return { data: { error: result.error, status: result.status } };
  }
  
  return { data: { calendar: result.calendar, status: 200 } };
}

export async function Course(cookie: string) {
  const result = await fetchCourseImproved(cookie);
  return result;
}

export async function userInfo(cookie: string) {
  const data = await fetchUserInfoImproved(cookie);
  return { data };
}
