/**
 * Improved attendance and marks fetching - matches working implementation exactly
 * Both attendance and marks come from the same My_Attendance page
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { withSessionCheck } from './sessionManager';

const SEM_ENDED = false;

interface AttendanceResult {
  attendance?: AttendanceDetail[];
  error?: string;
  status: number;
}

interface MarksResult {
  markList?: MarkDetail[];
  error?: string;
  status: number;
}

interface AttendanceDetail {
  courseCode: string;
  courseTitle: string;
  courseCategory: string;
  courseFaculty: string;
  courseSlot: string;
  courseConducted: number;
  courseAbsent: number;
  courseAttendance: string;
  courseAttendanceStatus: {
    status: string;
    color: string;
    message: string;
  };
  isClosedPortal?: boolean;
}

interface MarkDetail {
  course: string;
  category: string;
  marks: Array<{
    exam: string;
    obtained: number;
    maxMark: number;
  }>;
  total: {
    obtained: number;
    maxMark: number;
  };
}

const ATTENDANCE_PAGE_URLS = [
  'https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance',
  'https://academia.srmist.edu.in/',
];

function buildRequestHeaders(cookie: string, referer: string) {
  return {
    'X-Requested-With': 'XMLHttpRequest',
    Referer: referer,
    Accept: '*/*',
    Cookie: cookie,
  };
}

function decodeSanitizedPayload(encoded: string): string {
  return encoded
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\//g, '/')
    .replace(/\\-/g, '-')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function extractSanitizedHtml(rawHtml: string): string | null {
  const singleQuoteMatch = rawHtml.match(/pageSanitizer\.sanitize\('((?:\\.|[^'\\])*)'\)/s);
  if (singleQuoteMatch?.[1]) {
    return decodeSanitizedPayload(singleQuoteMatch[1]);
  }

  const doubleQuoteMatch = rawHtml.match(/pageSanitizer\.sanitize\("((?:\\.|[^"\\])*)"\)/s);
  if (doubleQuoteMatch?.[1]) {
    return decodeSanitizedPayload(doubleQuoteMatch[1]);
  }

  if (rawHtml.includes('<table') && rawHtml.toLowerCase().includes('course')) {
    return rawHtml;
  }

  return null;
}

async function fetchAttendancePage(cookie: string): Promise<string> {
  let lastError = 'Request failed';

  for (const url of ATTENDANCE_PAGE_URLS) {
    try {
      const response = await axios.get(url, {
        headers: buildRequestHeaders(cookie, url),
      });

      if (typeof response.data !== 'string') {
        continue;
      }

      const sanitizedHtml = extractSanitizedHtml(response.data);
      if (sanitizedHtml) {
        return sanitizedHtml;
      }

      lastError = 'sanitize() payload not found';
    } catch (error: any) {
      lastError = error?.message || 'Request failed';
    }
  }

  throw new Error(lastError || 'sanitize() payload not found');
}

function findAttendanceTable($: cheerio.CheerioAPI) {
  const byPercentOnlyHeader = $('table').filter((_, table) => {
    const header = $(table).find('tr').first().text().toLowerCase();
    return header.includes('course code') && header.includes('attn %');
  });

  if (SEM_ENDED && byPercentOnlyHeader.length > 0) {
    return byPercentOnlyHeader.first();
  }

  const byLegacySelector = $('table[style*="font-size :16px;"][bgcolor="#FAFAD2"]');
  if (byLegacySelector.length > 0) {
    return byLegacySelector.first();
  }

  const byHeaderSignature = $('table').filter((_, table) => {
    const header = $(table).find('tr').first().text().toLowerCase();
    return (
      header.includes('course code') &&
      header.includes('course title') &&
      (header.includes('absent') || header.includes('attendance'))
    );
  });

  return byHeaderSignature.first();
}

function parseAttendanceStatusFromPercent(percentage: number): AttendanceDetail['courseAttendanceStatus'] {
  if (percentage >= 75) {
    return {
      status: 'Safe',
      color: 'green',
      message: 'Attendance is at or above 75%',
    };
  }

  return {
    status: 'Low',
    color: 'red',
    message: 'Attendance is below 75%',
  };
}

function findMarksTable($: cheerio.CheerioAPI) {
  const byHeaderAndNestedTable = $('table').filter((_, table) => {
    const header = $(table).find('tr').first().text().toLowerCase();
    const hasExpectedHeader =
      header.includes('course') &&
      (
        header.includes('category') ||
        header.includes('course type') ||
        header.includes('test performance')
      );
    if (!hasExpectedHeader) {
      return false;
    }

    return $(table)
      .find('tr')
      .slice(1)
      .toArray()
      .some((row) => {
        const cols = $(row).find('td');
        return cols.length >= 3 && $(cols[2]).find('table').length > 0;
      });
  });

  if (byHeaderAndNestedTable.length > 0) {
    return byHeaderAndNestedTable.first();
  }

  return $('table:nth-child(7)').first();
}

function parseAttendanceDetails($: cheerio.CheerioAPI): AttendanceDetail[] {
  const table = findAttendanceTable($);
  if (table.length === 0) {
    return [];
  }

  const rows = table.find('tr').slice(1).toArray();
  const attendanceDetails: AttendanceDetail[] = [];

  for (const row of rows) {
    const cols = $(row).find('td');

    if (SEM_ENDED) {
      if (cols.length < 7) continue;

      const courseCode = $(cols[0]).contents().first().text().trim();
      const courseTitle = $(cols[1]).text().trim();
      const courseCategory = $(cols[2]).text().trim();
      const courseFaculty = $(cols[3]).text().trim().split('(')[0].trim();
      const courseSlot = $(cols[4]).text().trim();
      const rawAttendance = $(cols[cols.length - 1]).text().trim();
      const parsedAttendance = Number(rawAttendance.replace('%', '').trim());
      const attendancePercent = Number.isFinite(parsedAttendance) ? parsedAttendance : 0;

      attendanceDetails.push({
        courseCode,
        courseTitle,
        courseCategory,
        courseFaculty,
        courseSlot,
        courseConducted: attendancePercent,
        courseAbsent: 0,
        courseAttendance: attendancePercent.toFixed(2),
        courseAttendanceStatus: parseAttendanceStatusFromPercent(attendancePercent),
        isClosedPortal: true,
      });

      continue;
    }

    if (cols.length < 8) continue;

    const courseCode = $(cols[0]).contents().first().text().trim();
    const courseTitle = $(cols[1]).text().trim();
    const courseCategory = $(cols[2]).text().trim();
    const courseFaculty = $(cols[3]).text().trim().split('(')[0].trim();
    const courseSlot = $(cols[4]).text().trim();
    const courseConducted = Number($(cols[6]).text().trim()) || 0;
    const courseAbsent = Number($(cols[7]).text().trim()) || 0;

    const courseAttendanceStatus = calculateAttendanceStatus(courseConducted, courseAbsent);
    const courseAttendance = ((courseConducted - courseAbsent) / courseConducted * 100).toFixed(2);

    attendanceDetails.push({
      courseCode,
      courseTitle,
      courseCategory,
      courseFaculty,
      courseSlot,
      courseConducted,
      courseAbsent,
      courseAttendance: isNaN(Number(courseAttendance)) ? '0.00' : courseAttendance,
      courseAttendanceStatus,
      isClosedPortal: false,
    });
  }

  return attendanceDetails;
}

function parseMarksDetails($: cheerio.CheerioAPI): MarkDetail[] {
  const table = findMarksTable($);
  if (table.length === 0) {
    return [];
  }

  const marksDetails: MarkDetail[] = [];
  const tableRows = table.find('tr');

  tableRows.each((i, row) => {
    if (i === 0) return;

    const cols = $(row).find('td');
    if (cols.length < 3) return;

    const course = $(cols[0]).text().trim();
    const category = $(cols[1]).text().trim();
    const marksTable = $(cols[2]).find('table');

    if (course === '' || category === '' || marksTable.length === 0) return;

    const marks: Array<{ exam: string; obtained: number; maxMark: number }> = [];
    const total = { obtained: 0, maxMark: 0 };

    marksTable.find('td').each((_, markTd) => {
      const strongText = $(markTd).find('strong').text().trim();
      const [type, max] = strongText.split('/');
      const obtained = $(markTd)
        .text()
        .replace(strongText, '')
        .trim()
        .replace(/^\n+|\n+$/g, '');

      if (type && max) {
        const obtainedNum = Number(obtained);
        const maxNum = Number(max.trim());

        marks.push({
          exam: type.trim(),
          obtained: obtainedNum,
          maxMark: maxNum,
        });

        if (!isNaN(obtainedNum)) {
          total.obtained += obtainedNum;
        }
        if (!isNaN(maxNum)) {
          total.maxMark += maxNum;
        }
      }
    });

    total.obtained = Number(total.obtained.toFixed(2));
    total.maxMark = Number(total.maxMark.toFixed(2));

    marksDetails.push({ course, category, marks, total });
  });

  return marksDetails;
}

/**
 * Calculate attendance status based on conducted and absent counts
 */
function calculateAttendanceStatus(conducted: number, absent: number): {
  status: string;
  color: string;
  message: string;
} {
  if (conducted === 0) {
    return {
      status: 'No Classes',
      color: 'gray',
      message: 'No classes conducted yet',
    };
  }

  const present = conducted - absent;
  const percentage = (present / conducted) * 100;

  if (percentage >= 75) {
    const canMiss = Math.floor((present - 0.75 * conducted) / 0.75);
    return {
      status: 'Safe',
      color: 'green',
      message: canMiss > 0 ? `You can miss ${canMiss} more class${canMiss > 1 ? 'es' : ''}` : 'Maintain attendance',
    };
  } else {
    const needToAttend = Math.ceil((0.75 * conducted - present) / 0.25);
    return {
      status: 'Low',
      color: 'red',
      message: `Attend next ${needToAttend} class${needToAttend > 1 ? 'es' : ''} to reach 75%`,
    };
  }
}

/**
 * Fetch and parse attendance from My_Attendance page
 */
export async function fetchAttendanceImproved(cookie: string): Promise<AttendanceResult> {
  return withSessionCheck(
    async () => fetchAttendanceInternal(cookie),
    (result) => result.error === 'sanitize() payload not found' || (!result.attendance && !result.error)
  );
}

async function fetchAttendanceInternal(cookie: string): Promise<AttendanceResult> {
  try {
    const pageHtml = await fetchAttendancePage(cookie);
    const $ = cheerio.load(pageHtml);
    const attendanceDetails = parseAttendanceDetails($);

    if (attendanceDetails.length === 0) {
      return {
        error: 'Attendance table not found',
        status: 404,
      };
    }

    return {
      attendance: attendanceDetails,
      status: 200,
    };

  } catch (error: any) {
    return {
      error: error.message || 'Request failed',
      status: error.response?.status || 500,
    };
  }
}


/**
 * Combined function to fetch both attendance and marks in one request
 * More efficient as both data come from the same page
 */
export async function fetchAttendanceAndMarks(cookie: string): Promise<{
  attendance?: AttendanceDetail[];
  markList?: MarkDetail[];
  error?: string;
  status: number;
}> {
  return withSessionCheck(
    async () => fetchAttendanceAndMarksInternal(cookie),
    (result) => result.error === 'sanitize() payload not found' || (!result.attendance && !result.markList && !result.error)
  );
}

async function fetchAttendanceAndMarksInternal(cookie: string): Promise<{
  attendance?: AttendanceDetail[];
  markList?: MarkDetail[];
  error?: string;
  status: number;
}> {
  try {
    const pageHtml = await fetchAttendancePage(cookie);
    const $ = cheerio.load(pageHtml);
    const attendanceDetails = parseAttendanceDetails($);
    const marksDetails = parseMarksDetails($);

    return {
      attendance: attendanceDetails,
      markList: marksDetails,
      status: 200,
    };

  } catch (error: any) {
    return {
      error: error.message || 'Request failed',
      status: error.response?.status || 500,
    };
  }
}
export async function fetchMarksInternal(cookie: string): Promise<MarksResult> {
  try {
    const pageHtml = await fetchAttendancePage(cookie);
    const $ = cheerio.load(pageHtml);
    const marksDetails = parseMarksDetails($);

    if (marksDetails.length === 0) {
      return {
        error: 'Marks table not found',
        status: 404,
      };
    }

    return {
      markList: marksDetails,
      status: 200,
    };

  } catch (error: any) {
    return {
      error: error.message || 'Request failed',
      status: error.response?.status || 500,
    };
  }
}