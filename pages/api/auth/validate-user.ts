import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { rateLimit, getClientIP } from '@/utils/rateLimiter';

const BASE = 'https://academia.srmist.edu.in';

function getCsrfFromJar(jar: CookieJar) {
  const cookies = jar.getCookiesSync(BASE);
  const csrf = cookies.find((c: any) => c.key.toLowerCase().startsWith('iamcsr'));
  return csrf ? csrf.value : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 5 requests per 15 minutes per IP
  const clientIP = getClientIP(req);
  const rateLimitResult = rateLimit(`validate-user:${clientIP}`, 5, 15 * 60 * 1000);
  
  if (!rateLimitResult.success) {
    return res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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

    // Initial request to get CSRF token
    await client.get(
      `${BASE}/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&dcc=true`
    );

    // Get CSRF token from jar
    const csrf = getCsrfFromJar(jar);
    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: '*/*',
      'User-Agent': 'axios/1.x'
    };
    if (csrf) headers['X-Zcsrf-Token'] = `iamcsrcoo=${csrf}`;

    // Validate user
    const url = `${BASE}/accounts/p/40-10002227248/signin/v2/lookup/${email}`;
    const body = new URLSearchParams({
      mode: 'primary',
      cli_time: Date.now().toString(),
      orgtype: '40',
      servicename: 'ZohoCreator',
      service_language: 'en',
      serviceurl: 'https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2F...',
    });

    const response = await client.post(url, body.toString(), { headers });
    const result = response.data;

    if (result?.status_code !== 201 || !result.lookup) {
      return res.status(200).json({ 
        res: result,
        error: result?.message || 'User validation failed'
      });
    }

    // Store jar cookies in response so client can use them in next request
    const cookieHeader = jar.getCookieStringSync(BASE);
    
    // Extract identifier and digest from lookup
    const { identifier, digest } = result.lookup || {};
    
    return res.status(200).json({ 
      res: {
        ...result,
        identifier,
        digest,
        status_code: result.status_code
      },
      cookies: cookieHeader
    });
  } catch (err: any) {
    console.error('Validate user error:', err?.message);
    return res.status(500).json({ 
      valid: false, 
      message: 'Internal server error',
      error: err?.message
    });
  }
}
