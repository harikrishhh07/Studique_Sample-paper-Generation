import { NextApiRequest, NextApiResponse } from 'next';
import { timetable } from "@/server/action";
import { isValidToken } from '@/utils/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    
    // Validate token presence and format
    if (!token || !isValidToken(token)) {
      return res.status(401).json({ error: 'Invalid or missing authentication token' });
    }

    const result = await timetable(token);

    // If upstream returned an error payload, surface it with its status
    if ((result as any)?.data?.error) {
      const status = (result as any).data.status || 500;
      return res.status(status).json({ error: (result as any).data.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Timetable API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
