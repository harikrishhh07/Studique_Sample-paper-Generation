/**
 * Academia Session Manager
 * Detects session limit issues and provides helpful error messages
 */

import axios from 'axios';

/**
 * Check if error or result indicates session limit reached
 */
export function isSessionLimitError(error?: any, result?: any): boolean {
  // Check for 401/403 status
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return true;
  }

  // Check for "Failed to extract user details" which indicates session issue
  if (result?.error === 'Failed to extract user details' || result?.error === 'sanitize() payload not found') {
    return true;
  }

  // Check for empty/invalid response that might indicate session issue
  if (result && !result.error) {
    const hasKnownData =
      Boolean(result.userInfo) ||
      Boolean(result.attendance) ||
      Boolean(result.markList) ||
      Boolean(result.timetable) ||
      Boolean(result.courseList) ||
      Boolean(result.calendar);

    if (!hasKnownData) {
      return true;
    }
  }

  // Check error message
  const errorMsg = error?.message?.toLowerCase() || '';
  if (errorMsg.includes('session') || errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
    return true;
  }

  return false;
}

/**
 * Get user-friendly error message for session limit
 */
export function getSessionLimitMessage(): string {
  return 'You have reached the maximum number of active sessions (2 devices). Please log out from another device and try again.';
}

/**
 * Simple wrapper to check for session errors and return helpful error
 */
export async function withSessionCheck<T>(
  fetchFn: () => Promise<T>,
  errorChecker?: (result: T) => boolean
): Promise<T> {
  try {
    const result = await fetchFn();

    // Check if result indicates session error
    if (errorChecker && errorChecker(result)) {
      throw new Error(getSessionLimitMessage());
    }

    if (isSessionLimitError(undefined, result)) {
      throw new Error(getSessionLimitMessage());
    }

    return result;
  } catch (error: any) {
    if (isSessionLimitError(error)) {
      throw new Error(getSessionLimitMessage());
    }
    throw error;
  }
}
