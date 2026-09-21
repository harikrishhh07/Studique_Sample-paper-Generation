import axios from 'axios';
import * as cheerio from 'cheerio';
import { withSessionCheck } from './sessionManager';

export interface UserInfo {
  regNumber: string;
  name: string;
  mobile: string;
  section: string;
  program: string;
  department: string;
  semester: string;
  batch: string;
}

interface UserInfoResult {
  userInfo?: UserInfo;
  error?: string;
  status: number;
}

const USER_INFO_URL = 'https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24';

function decodeSanitizedPayload(encoded: string): string {
  return encoded
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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

async function fetchUserInfoInternal(cookie: string): Promise<UserInfoResult> {
  try {
    const response = await axios.get(USER_INFO_URL, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        cookie,
        Referer: USER_INFO_URL,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });

    const html = response.data;

    if (typeof html !== 'string') {
      return { error: 'Failed to extract user details', status: 404 };
    }

    const decodedHtml = extractSanitizedHtml(html);
    if (!decodedHtml) {
      return { error: 'Failed to extract user details', status: 404 };
    }

    const $ = cheerio.load(decodedHtml);
    const getText = (selector: string) => $(selector).text().trim();

    const departmentText = getText('td:contains("Department:") + td strong');
    const sectionMatch = departmentText.match(/\((.*?Section\s*(\w+))\)/);
    const section = sectionMatch ? sectionMatch[2] : '';
    const department = departmentText.split('-')[0].trim();

    const userInfo: UserInfo = {
      regNumber: getText('td:contains("Registration Number:") + td strong'),
      name: getText('td:contains("Name:") + td strong'),
      mobile: getText('td:contains("Mobile:") + td strong'),
      section,
      program: getText('td:contains("Program:") + td strong'),
      department,
      semester: getText('td:contains("Semester:") + td strong'),
      batch: getText('td:contains("Batch:") + td strong').replace(/\D+/g, ''),
    };

    return { userInfo, status: 200 };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 500 || error.response?.status === 401) {
        return { error: 'Unauthorized', status: 401 };
      }
      return {
        error: error.message || 'Failed to fetch user info',
        status: error.response?.status || 500,
      };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch user info',
      status: 500,
    };
  }
}

// The academia session cookie is stable for a user, so resolving it (a slow
// round-trip to academia.srmist.edu) can be cached. Reduce the TTL to harden
// against stale data after a password change / logout elsewhere.
const CACHED_USER_TTL = 10 * 60 * 1000; // 10 minutes
const userCache = new Map<string, { ts: number; data: UserInfoResult }>();

export async function fetchUserInfoImproved(cookie: string): Promise<UserInfoResult> {
  const hit = userCache.get(cookie);
  if (hit && Date.now() - hit.ts < CACHED_USER_TTL) {
    return hit.data;
  }

  const data = await withSessionCheck(
    () => fetchUserInfoInternal(cookie),
    (result) => result.error === 'Failed to extract user details' || !result.userInfo
  );

  userCache.set(cookie, { ts: Date.now(), data });
  return data;
}
