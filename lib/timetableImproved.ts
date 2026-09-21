/**
 * Improved timetable fetching - matches working Python implementation exactly
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { DaySchedule, CourseSlot } from 'srm-academia-api';
import { withSessionCheck } from './sessionManager';

interface TimetableResult {
  timetable?: DaySchedule[];
  error?: string;
  status: number;
}

interface StudentDetails {
  RegNumber: string | null;
  Name: string | null;
  Batch: number;
  Mobile: string | null;
  Department: string | null;
  Semester: number | null;
}

interface CourseInfo {
  'S.No': string;
  'Course Code': string;
  'Course Title': string;
  'Credit': string;
  'Regn. Type': string;
  'Category': string;
  'Course Type': string;
  'Faculty Name': string;
  'Slot': string;
  'Room No.': string;
  'Academic Year': string;
}

interface StudentData {
  student: StudentDetails;
  courses: CourseInfo[];
}

const TIMETABLE_URL = 'https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24';

function parseBatchNumber(batchText: string | null): number | null {
  if (!batchText) return null;

  const normalized = batchText.trim();
  if (!normalized) return null;

  const upper = normalized.toUpperCase();

  const explicitBatchMatch = upper.match(/\bBATCH\s*[:\-]?\s*([12])\b/);
  if (explicitBatchMatch) {
    return parseInt(explicitBatchMatch[1], 10);
  }

  const slashParts = normalized.split('/').map((part) => part.trim()).filter(Boolean);
  if (slashParts.length > 0) {
    const lastPart = slashParts[slashParts.length - 1];
    const lastPartMatch = lastPart.match(/^\D*([12])\D*$/);
    if (lastPartMatch) {
      return parseInt(lastPartMatch[1], 10);
    }
  }

  const trailingMatch = normalized.match(/([12])\s*$/);
  if (trailingMatch) {
    return parseInt(trailingMatch[1], 10);
  }

  const wholeValueMatch = normalized.match(/^\D*([12])\D*$/);
  if (wholeValueMatch) {
    const parsed = parseInt(wholeValueMatch[1], 10);
    if (parsed === 1 || parsed === 2) {
      return parsed;
    }
  }

  return null;
}

// Time slots for each period
const time = [
  "08:00 AM - 08:50 AM",
  "08:50 AM - 09:40 AM",
  "09:45 AM - 10:35 AM",
  "10:40 AM - 11:30 AM",
  "11:35 AM - 12:25 PM",
  "12:30 PM - 01:20 PM",
  "01:25 PM - 02:15 PM",
  "02:20 PM - 03:10 PM",
  "03:10 PM - 04:00 PM",
  "04:00 PM - 04:50 PM",
];

// Batch slot configurations
const batchSlots: Record<number, any> = {
  1: {
    slots: [
      {
        dayOrder: "Day 1",
        slots: ["A", "A/X", "F/X", "F", "G", "P6", "P7", "P8", "P9", "P10"],
        time,
      },
      {
        dayOrder: "Day 2",
        slots: ["P11", "P12/X", "P13/X", "P14", "P15", "B", "B", "G", "G", "A"],
        time,
      },
      {
        dayOrder: "Day 3",
        slots: ["C", "C/X", "A/X", "D", "B", "P26", "P27", "P28", "P29", "P30"],
        time,
      },
      {
        dayOrder: "Day 4",
        slots: ["P31", "P32/X", "P33/X", "P34", "P35", "D", "D", "B", "E", "C"],
        time,
      },
      {
        dayOrder: "Day 5",
        slots: ["E", "E/X", "C/X", "F", "D", "P46", "P47", "P48", "P49", "P50"],
        time,
      },
    ],
  },
  2: {
    slots: [
      {
        dayOrder: "Day 1",
        slots: ["P1", "P2/X", "P3/X", "P4", "P5", "A", "A", "F", "F", "G"],
        time,
      },
      {
        dayOrder: "Day 2",
        slots: ["B", "B/X", "G/X", "G", "A", "P16", "P17", "P18", "P19", "P20"],
        time,
      },
      {
        dayOrder: "Day 3",
        slots: ["P21", "P22/X", "P23/X", "P24", "P25", "C", "C", "A", "D", "B"],
        time,
      },
      {
        dayOrder: "Day 4",
        slots: ["D", "D/X", "B/X", "E", "C", "P36", "P37", "P38", "P39", "P40"],
        time,
      },
      {
        dayOrder: "Day 5",
        slots: ["P41", "P42/X", "P43/X", "P44", "P45", "E", "E", "C", "F", "D"],
        time,
      },
    ],
  },
};

function normalizeSlotValue(value: string): string {
  return value.trim().toUpperCase();
}

function extractSlotTokens(value: string): string[] {
  const normalized = normalizeSlotValue(value);
  const parts = normalized
    .split(/[^A-Z0-9]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return [...new Set(parts)];
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

  if (rawHtml.includes('<table') && rawHtml.toLowerCase().includes('registration number')) {
    return rawHtml;
  }

  return null;
}

export async function fetchTimetableImproved(cookie: string): Promise<TimetableResult> {
  return withSessionCheck(
    async () => fetchTimetableInternal(cookie),
    (result) => result.error === 'sanitize() payload not found' || (!result.timetable && !result.error)
  );
}

async function fetchTimetableInternal(cookie: string): Promise<TimetableResult> {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': TIMETABLE_URL,
    'Accept': '*/*',
    'Cookie': cookie,
  };

  try {
    // Step 2: Fetch the page
    const response = await axios.get(TIMETABLE_URL, { headers });
    const html = response.data;

    if (typeof html !== 'string') {
      return {
        error: 'sanitize() payload not found',
        status: 404,
      };
    }
    
    // Step 3: Extract sanitize() payload - resilient to portal formatting changes
    const decoded_html = extractSanitizedHtml(html);

    if (!decoded_html) {
      return {
        error: 'sanitize() payload not found',
        status: 404,
      };
    }

    // Step 5: Parse with cheerio (like BeautifulSoup)
    const $ = cheerio.load(decoded_html);
    
    // Step 6: Find mainDiv - exactly as Python does
    const mainDiv = $('.mainDiv');

    if (mainDiv.length === 0) {
      return {
        error: 'mainDiv not found after decoding',
        status: 404,
      };
    }

// Step 7: Parse student details and courses - exactly as Python does
    return parseStudentDetailsAndBuildTimetable(mainDiv.html() || '');

  } catch (error: any) {
    return {
      error: error.message || 'Request failed',
      status: error.response?.status || 500,
    };
  }
}

/**
 * Parse student details and courses from the decoded HTML
 * Matches Python's parse_student_details() function exactly
 */
function parseStudentDetails(htmlContent: string): StudentData {
  const $ = cheerio.load(htmlContent);
  
  // --- Student Information ---
  let regNumber: string | null = null;
  let name: string | null = null;
  let explicitBatchText: string | null = null;
  let comboBatchText: string | null = null;
  let mobile: string | null = null;
  let department: string | null = null;
  let semester: string | null = null;

  const infoTable = $('table').filter((_, table) => {
    const text = $(table).text().toLowerCase();
    return text.includes('registration number') && text.includes('name:');
  }).first();

  if (infoTable.length > 0) {
    const tds = infoTable.find('td');
    
    for (let i = 0; i < tds.length; i++) {
      const label = $(tds[i]).text().trim();
      
      if (label === 'Registration Number:' && i + 1 < tds.length) {
        regNumber = $(tds[i + 1]).text().trim();
      } else if (label === 'Name:' && i + 1 < tds.length) {
        name = $(tds[i + 1]).text().trim();
      } else if ((label === 'Batch:' || label === 'Batch') && i + 1 < tds.length) {
        explicitBatchText = $(tds[i + 1]).text().trim() || null;
      } else if (label === 'Combo / Batch:' && i + 1 < tds.length) {
        comboBatchText = $(tds[i + 1]).text().trim() || null;
      } else if (label === 'Mobile:' && i + 1 < tds.length) {
        mobile = $(tds[i + 1]).text().trim();
      } else if (label === 'Department:' && i + 1 < tds.length) {
        department = $(tds[i + 1]).text().trim();
      } else if (label === 'Semester:' && i + 1 < tds.length) {
        semester = $(tds[i + 1]).text().trim();
      }
    }
  }

  if (!explicitBatchText) {
    const selectorBatchText = $('td:contains("Batch:") + td strong font, td:contains("Batch:") + td strong').first().text().trim();
    explicitBatchText = selectorBatchText || null;
  }

  if (!explicitBatchText) {
    const infoText = infoTable.text().replace(/\s+/g, ' ').trim();
    const batchMatch = infoText.match(/Batch\s*:?\s*([12])/i);
    if (batchMatch?.[1]) {
      explicitBatchText = batchMatch[1];
    }
  }

  if (!comboBatchText) {
    const selectorComboBatchText = $('td:contains("Combo / Batch:") + td strong').first().text().trim();
    comboBatchText = selectorComboBatchText || null;
  }

  const batchText = explicitBatchText || comboBatchText;

  // --- Course Table ---
  const courseTable = $('table.course_tbl');
  if (courseTable.length === 0) {
    throw new Error('Course table not found in timetable HTML');
  }

  const courses: CourseInfo[] = [];
  
  // Get all TD elements from the course table
  const allTd = courseTable.find('td').toArray();
  const columnsPerCourse = 11;
  
  // Start from columnsPerCourse (skip header row), iterate in chunks of 11
  for (let i = columnsPerCourse; i < allTd.length; i += columnsPerCourse) {
    if (i + columnsPerCourse > allTd.length) {
      break;
    }
    
    const tds = allTd.slice(i, i + columnsPerCourse);
    
    const course: CourseInfo = {
      'S.No': $(tds[0]).text().trim(),
      'Course Code': $(tds[1]).text().trim(),
      'Course Title': $(tds[2]).text().trim(),
      'Credit': $(tds[3]).text().trim(),
      'Regn. Type': $(tds[4]).text().trim(),
      'Category': $(tds[5]).text().trim(),
      'Course Type': $(tds[6]).text().trim(),
      'Faculty Name': $(tds[7]).text().trim(),
      'Slot': $(tds[8]).text().trim(),
      'Room No.': $(tds[9]).text().trim(),
      'Academic Year': $(tds[10]).text().trim(),
    };

    courses.push(course);
  }

  return {
    student: {
      RegNumber: regNumber,
      Name: name,
      Batch: parseBatchNumber(batchText) || 1,
      Mobile: mobile,
      Department: department,
      Semester: semester ? parseInt(semester) : null,
    },
    courses,
  };
}

/**
 * Build structured timetable with course details and timing
 * Matches Python's get_timetable() function exactly
 */
function buildTimetable(studentData: StudentData): DaySchedule[] {
  const { courses, student } = studentData;
  const batch = student.Batch;
  
  // Slot index → (StartTime, EndTime) - exactly as Python
  const slotTimes = [
    ['08:00', '08:50'],
    ['08:50', '09:40'],
    ['09:45', '10:35'],
    ['10:40', '11:30'],
    ['11:35', '12:25'],
    ['12:30', '01:20'],
    ['01:25', '02:15'],
    ['02:20', '03:10'],
    ['03:10', '04:00'],
    ['04:00', '04:50'],
  ];

  // Get batch configuration
  const batchConfig = batch === 1 ? batchSlots[1] : batchSlots[2];
  if (!batchConfig) {
    throw new Error(`Batch ${batch} configuration not found`);
  }

  const timetable: DaySchedule[] = [];

  // Build normalized slot token → course mapping
  const slotToCourse: Record<string, any> = {};
  
  for (const course of courses) {
    const slots = extractSlotTokens(course['Slot']);
    
    for (const slot of slots) {
      if (!slotToCourse[slot]) {
        slotToCourse[slot] = {
          courseCode: course['Course Code'],
          courseType: course['Course Type'],
          courseTitle: course['Course Title'],
          faculty: course['Faculty Name'],
          room: course['Room No.'],
        };
      }
    }
  }

  const resolveCourseByTimetableSlot = (timetableSlot: string) => {
    const normalizedSlot = normalizeSlotValue(timetableSlot);
    if (slotToCourse[normalizedSlot]) {
      return slotToCourse[normalizedSlot];
    }

    const slotTokens = extractSlotTokens(timetableSlot);
    for (const token of slotTokens) {
      if (slotToCourse[token]) {
        return slotToCourse[token];
      }
    }

    return undefined;
  };

  for (const dayInfo of batchConfig.slots) {
    const schedule: CourseSlot[] = [];

    for (let i = 0; i < dayInfo.slots.length; i++) {
      const slot = dayInfo.slots[i];
      const courseInfo = resolveCourseByTimetableSlot(slot);
      
      // Slots are already in 12-hour format, just add AM/PM
      // Slots 0-4 are morning (AM), slots 5-9 are afternoon (PM)
      const startTime = slotTimes[i][0];
      const endTime = slotTimes[i][1];
      const period = i < 5 ? 'AM' : 'PM';
      
      const timeStr = `${startTime} ${period} - ${endTime} ${period}`;

      schedule.push({
        slot,
        time: timeStr,
        isClass: !!courseInfo,
        ...(courseInfo && {
          courseCode: courseInfo.courseCode,
          courseTitle: courseInfo.courseTitle,
          courseType: courseInfo.courseType,
          courseRoomNo: courseInfo.room,
        }),
      });
    }

    timetable.push({
      dayOrder: dayInfo.dayOrder,
      class: schedule,
    });
  }

  return timetable;
}

/**
 * Parse student details and build timetable - combines parse_student_details() and get_timetable()
 */
function parseStudentDetailsAndBuildTimetable(mainDivHtml: string): TimetableResult {
  try {
    // Step 1: Parse student details and courses (Python's parse_student_details)
    const studentData = parseStudentDetails(mainDivHtml);
    
    // Step 2: Build structured timetable (Python's get_timetable)
    const timetable = buildTimetable(studentData);

    return {
      timetable,
      status: 200,
    };
  } catch (error: any) {
    return {
      error: error.message || 'Failed to parse timetable',
      status: 500,
    };
  }
}
