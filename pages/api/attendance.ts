import { NextApiRequest, NextApiResponse } from 'next';
import { attendance } from "@/server/action";
import { isValidToken } from '@/utils/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prevent caching of this endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const token = req.cookies.token;
    
    if (!token || !isValidToken(token)) {
      return res.status(401).json({ error: 'Invalid or missing authentication token' });
    }

    const result = await attendance(token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
