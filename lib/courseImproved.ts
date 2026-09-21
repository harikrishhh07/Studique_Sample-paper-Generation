import axios from "axios";
import * as cheerio from "cheerio";
import { withSessionCheck } from "./sessionManager";

interface CourseDetail {
  courseCode: string;
  courseTitle: string;
  courseCredit: string;
  courseCategory: string;
  courseType: string;
  courseFaculty: string;
  courseSlot: string[];
  courseRoomNo: string;
}

interface CourseResult {
  courseList?: CourseDetail[];
  batch?: string;
  error?: string;
  status: number;
}

function buildRequestHeaders(cookie: string, referer: string) {
  return {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Cookie: cookie,
    Referer: referer,
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

async function courseDynamicUrl() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const academicYearString =
    currentMonth >= 1 && currentMonth <= 6
      ? `${currentYear - 1}_${currentYear.toString().slice(-2)}`
      : `${currentYear}_${(currentYear + 1).toString().slice(-2)}`;

  return `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_${academicYearString}`;
}

async function getCandidateCourseUrls() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const candidates = new Set<string>();

  candidates.add(await courseDynamicUrl());
  candidates.add("https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24");
  candidates.add("https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table");
  candidates.add("https://academia.srmist.edu.in/");

  for (let offset = -3; offset <= 1; offset++) {
    const startYear = currentYear + offset;
    const endYearTwoDigits = (startYear + 1).toString().slice(-2);
    candidates.add(
      `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_${startYear}_${endYearTwoDigits}`
    );
  }

  return Array.from(candidates);
}

function decodeSanitizedPayload(encoded: string): string {
  return encoded
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\//g, "/")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function extractHtml(rawHtml: string): string | null {
  const singleQuoteMatch = rawHtml.match(/pageSanitizer\.sanitize\('((?:\\.|[^'\\])*)'\)/s);
  if (singleQuoteMatch?.[1]) {
    return decodeSanitizedPayload(singleQuoteMatch[1]);
  }

  const doubleQuoteMatch = rawHtml.match(/pageSanitizer\.sanitize\("((?:\\.|[^"\\])*)"\)/s);
  if (doubleQuoteMatch?.[1]) {
    return decodeSanitizedPayload(doubleQuoteMatch[1]);
  }

  if (rawHtml.includes("course_tbl") || rawHtml.toLowerCase().includes("course code")) {
    return rawHtml;
  }

  return null;
}

async function fetchCoursePage(cookie: string): Promise<string> {
  const urls = await getCandidateCourseUrls();
  let lastErrorMessage = "Failed to fetch course details";

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: buildRequestHeaders(cookie, url),
      });

      if (typeof response.data !== "string") {
        lastErrorMessage = "Failed to fetch course details";
        continue;
      }

      const html = extractHtml(response.data);
      if (!html) {
        lastErrorMessage = "Failed to extract course details";
        continue;
      }
      return html;
    } catch (error: any) {
      lastErrorMessage = error?.message || "Request failed";
    }
  }

  throw new Error(lastErrorMessage);
}

function findCourseTable($: cheerio.CheerioAPI) {
  const byClass = $(".course_tbl");
  if (byClass.length > 0) {
    return byClass.first();
  }

  const byHeaders = $("table").filter((_, table) => {
    const header = $(table).find("tr").first().text().toLowerCase();
    return (
      header.includes("course code") &&
      header.includes("course title") &&
      header.includes("credit")
    );
  });

  if (byHeaders.length > 0) {
    return byHeaders.first();
  }

  return $("table").first();
}

function parseCourseDetailsFromHtml(pageHtml: string): CourseResult {
  try {
    const $ = cheerio.load(pageHtml);
    const table = findCourseTable($);

    if (table.length === 0) {
      return { error: "Course table not found", status: 404 };
    }

    let batch = "";
    try {
      batch = $("td:contains('Batch:')").next("td").find("font").text().trim();
    } catch {
      batch = "";
    }

    const rows = table.find("tr").toArray();
    const courseList: CourseDetail[] = [];

    rows.slice(1).forEach((row) => {
      const columns = $(row).find("td");
      if (columns.length < 4) {
        return;
      }

      const get = (index: number) =>
        columns[index] ? $(columns[index]).text().trim() : "";
      const getFormat = (index: number) => (get(index).length === 0 ? "NA" : get(index));
      const slotRaw = get(8);
      const courseSlot = slotRaw
        ? slotRaw
            .split("-")
            .map((slot) => slot.trim())
            .filter(Boolean)
        : [];

      courseList.push({
        courseCode: getFormat(1),
        courseTitle: getFormat(2),
        courseCredit: getFormat(3),
        courseCategory: getFormat(5),
        courseType: getFormat(6),
        courseFaculty: getFormat(7),
        courseSlot,
        courseRoomNo: getFormat(10).startsWith("AY") ? getFormat(9) : getFormat(10),
      });
    });

    if (courseList.length === 0) {
      return { error: "Course table not found", status: 404 };
    }

    return { courseList, batch, status: 200 };
  } catch (error: any) {
    return {
      error: error?.message || "Failed to parse course details",
      status: error?.status || 500,
    };
  }
}

export async function fetchCourseImproved(cookie: string): Promise<CourseResult> {
  return withSessionCheck(
    async () => {
      try {
        const pageHtml = await fetchCoursePage(cookie);
        return parseCourseDetailsFromHtml(pageHtml);
      } catch (error: any) {
        return {
          error: error?.message || "Request failed",
          status: error?.response?.status || 500,
        };
      }
    },
    (result: any) =>
      result?.error === "Failed to extract course details" ||
      (!result?.courseList && !result?.error)
  );
}
