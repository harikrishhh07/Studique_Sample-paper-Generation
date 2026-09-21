import { NextApiRequest, NextApiResponse } from 'next';
import { getLogout } from "@/server/action";
import { clearSecureCookie } from '@/utils/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    
    // Always clear the secure cookie, regardless of token validity
    const clearCookie = clearSecureCookie('token');
    res.setHeader('Set-Cookie', clearCookie);
    
    // If token exists, try to call logout on server
    if (token) {
      try {
        const result = await getLogout(token);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        // Suppressed server logout errors; still return success
        res.status(200).json({ success: true, message: 'Logged out locally' });
      }
    } else {
      res.status(200).json({ success: true, message: 'Logged out' });
    }
  } catch (error) {
    // Suppressed logout API error
    const clearCookie = clearSecureCookie('token');
    res.setHeader('Set-Cookie', clearCookie);
    res.status(200).json({ success: true, message: 'Logged out with error' });
  }
}
