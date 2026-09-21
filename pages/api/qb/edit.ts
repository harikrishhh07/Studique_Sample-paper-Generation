import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidToken, decodeToken } from '@/utils/security';
import { rateLimit, getClientIP } from '@/utils/rateLimiter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Question ID parameter missing' });
  }

  const token = req.cookies.token;
  const clientIP = getClientIP(req);
  let userId = 'student_guest_' + clientIP.replace(/[^a-zA-Z0-9]/g, '');

  if (token && isValidToken(token)) {
    const decoded = decodeToken(token) || {};
    userId = decoded.sub || decoded.regNo || decoded.email || userId;
  } else if (req.cookies['studique-session-id']) {
    userId = req.cookies['studique-session-id'];
  }

  const rateCheck = rateLimit(`qb-edit-${userId}`, 30, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const fastApiUrl = process.env.FASTAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const proxySecret = process.env.PROXY_SHARED_SECRET || 'studique_internal_proxy_secret_2026';

    const response = await fetch(`${fastApiUrl}/qb/question/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Studique-Proxy-Secret': proxySecret,
        'X-Student-User-Id': userId,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || 'Failed to edit question' });
    }

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: 'Proxy edit error: ' + e.message });
  }
}
