import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { rateLimit, getClientIP } from '@/utils/rateLimiter';
import { setSecureCookie } from '@/utils/security';

const BASE = 'https://academia.srmist.edu.in';
const TERMINATE_PATH = '/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions';

function getCsrfFromJar(jar: CookieJar) {
  const cookies = jar.getCookiesSync(BASE);
  const csrf = cookies.find((c: any) => c.key.toLowerCase().startsWith('iamcsr'));
  return csrf ? csrf.value : null;
}

function isSessionLimitResponse(result: any): boolean {
  if (!result) return false;

  const messageCandidates = [
    result?.message,
    result?.localized_message,
    result?.error,
    result?.cause,
    result?.status_message,
  ]
    .filter(Boolean)
    .map((value: any) => String(value).toLowerCase());

  const combined = `${messageCandidates.join(' ')} ${JSON.stringify(result).toLowerCase()}`;
  return (
    combined.includes('maximum number of active sessions') ||
    combined.includes('active sessions') ||
    combined.includes('block sessions')
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 10 password attempts per 15 minutes per IP
  const clientIP = getClientIP(req);
  const rateLimitResult = rateLimit(`validate-password:${clientIP}`, 10, 15 * 60 * 1000);
  
  if (!rateLimitResult.success) {
    return res.status(429).json({ 
      error: 'Too many password attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
  }

  try {
    const { digest, identifier, password, cookies: clientCookies } = req.body;
    let sessionLimitDetected = false;
    let autoRecoveryAttempted = false;
    let autoRecoverySucceeded = false;
    
    if (!digest || !identifier || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create axios client with cookie jar support
    const jar = new CookieJar();
    const client = wrapper(
      axios.create({
        withCredentials: true,
        timeout: 12000,
        headers: {
          Accept: '*/*',
          'User-Agent': 'academia-wrapper/1.0',
        },
        validateStatus: (status) => status < 500,
      }) as any
    ) as any;
    
    // Set the jar on the client
    client.defaults.jar = jar;
    
    // If we have cookies from previous request, set them
    if (clientCookies) {
      try {
        const cookieArray = clientCookies.split(';').map((c: string) => c.trim());
        for (const cookie of cookieArray) {
          jar.setCookieSync(cookie, BASE);
        }
      } catch (e) {
        // Ignore cookie parsing errors
      }
    }

    // Get CSRF token from jar
    const csrf = getCsrfFromJar(jar);
    const headers: any = {
      'Content-Type': 'application/json;charset=UTF-8',
    };
    if (csrf) headers['X-Zcsrf-Token'] = `iamcsrcoo=${csrf}`;

    // Validate password
    const url = `${BASE}/accounts/p/40-10002227248/signin/v2/primary/${identifier}/password`;
    const params = {
      digest,
      cli_time: Date.now().toString(),
      servicename: 'ZohoCreator',
      service_language: 'en',
      serviceurl: 'https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2F...',
    };
    const body = { passwordauth: { password } };

    const response = await client.post(url, body, { headers, params });
    let result = response.data;

    // If session limit is hit, auto-terminate sessions and retry once with the same credentials.
    if (isSessionLimitResponse(result)) {
      sessionLimitDetected = true;
      try {
        const cookieHeader = jar.getCookieStringSync(BASE);
        const retryCsrf = getCsrfFromJar(jar);

        if (cookieHeader && retryCsrf) {
          autoRecoveryAttempted = true;
          const terminateHeaders: any = {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            Cookie: cookieHeader,
            Origin: BASE,
            Referer: `${BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`,
            'X-Zcsrf-Token': `iamcsrcoo=${retryCsrf}`,
          };

          await client.delete(`${BASE}${TERMINATE_PATH}`, {
            headers: terminateHeaders,
            timeout: 12000,
            validateStatus: (status: number) => status < 500,
          });

          const retryResponse = await client.post(url, body, { headers, params });
          result = retryResponse.data;
          if (result?.status_code === 201) {
            autoRecoverySucceeded = true;
          }
        }
      } catch (recoverError) {
        // Ignore auto-recovery failure and return original auth outcome below
      }
    }

    // If authentication successful
    if (result?.status_code === 201) {
      const cookieHeader = jar.getCookieStringSync(BASE);
      const secureCookie = setSecureCookie('token', cookieHeader);
      res.setHeader('Set-Cookie', secureCookie);
      
      return res.status(200).json({ 
        res: { 
          isAuthenticated: true,
          success: true,
          status_code: 201
        },
        meta: {
          sessionLimitDetected,
          autoRecoveryAttempted,
          autoRecoverySucceeded,
        },
      });
    }

    return res.status(200).json({
      res: result,
      meta: {
        sessionLimitDetected,
        autoRecoveryAttempted,
        autoRecoverySucceeded,
      },
    });
  } catch (err: any) {
    console.error('Validate password error:', err?.message);
    return res.status(500).json({ 
      valid: false, 
      message: 'Internal server error',
      error: err?.message
    });
  }
}
