import { NextApiRequest, NextApiResponse } from 'next';
import { userInfo } from "@/server/action";
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
    
    // Validate token presence and format
    if (!token || !isValidToken(token)) {
      return res.status(401).json({ error: 'Invalid or missing authentication token' });
    }

    const result = await userInfo(token);
    
    res.status(200).json(result);
  } catch (error: any) {
    // Check if it's a session limit error
    if (error?.message?.includes('maximum number of active sessions')) {
      return res.status(403).json({ 
        error: error.message,
        sessionLimit: true,
        terminationUrl: 'https://academia.srmist.edu.in/app/49910842/portal/academia-academic-services/myProfile'
      });
    }
    // suppressed error logging for other errors
    res.status(500).json({ error: 'Internal server error' });
  }
}
