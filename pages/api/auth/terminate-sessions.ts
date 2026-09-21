import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { rateLimit, getClientIP } from '@/utils/rateLimiter';
import { isValidToken } from '@/utils/security';

const BASE = 'https://academia.srmist.edu.in';
const TERMINATE_PATH = '/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions';

function extractIamcsr(tokenCookieHeader: string): string | null {
  const cookies = tokenCookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const equalIndex = cookie.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }

    const name = cookie.slice(0, equalIndex).trim().toLowerCase();
    const value = cookie.slice(equalIndex + 1).trim();

    if (name === 'iamcsr') {
      return value || null;
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = rateLimit(`terminate-sessions:${clientIP}`, 5, 5 * 60 * 1000);

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Too many attempts. Please try again shortly.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
    });
  }

  try {
    const token = req.cookies.token;

    if (!token || !isValidToken(token)) {
      return res.status(401).json({ error: 'Invalid or missing authentication token' });
    }

    const iamcsr = extractIamcsr(token);
    if (!iamcsr) {
      return res.status(400).json({ error: 'Session CSRF token was not found' });
    }

    const userAgent = typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : 'Mozilla/5.0';

    const response = await axios.delete(`${BASE}${TERMINATE_PATH}`, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: token,
        Origin: BASE,
        Referer: `${BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`,
        'X-Zcsrf-Token': `iamcsrcoo=${iamcsr}`,
        'User-Agent': userAgent,
      },
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 200 && response.status < 300) {
      return res.status(200).json({ success: true, terminated: true });
    }

    if (response.status === 401 || response.status === 403) {
      return res.status(403).json({
        error: 'Your Academia session has expired. Please log in again.',
        terminated: false,
      });
    }

    return res.status(502).json({
      error: 'Could not terminate sessions right now. Please try again.',
      terminated: false,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to terminate sessions',
      terminated: false,
    });
  }
}
