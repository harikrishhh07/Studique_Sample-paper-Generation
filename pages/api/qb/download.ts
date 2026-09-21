import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileRef } = req.query;
  if (!fileRef || typeof fileRef !== 'string') {
    return res.status(400).json({ error: 'fileRef parameter missing' });
  }

  // Prevent path traversal
  const normalizedPath = path.normalize(fileRef);
  if (normalizedPath.includes('..') || !normalizedPath.startsWith('uploads/')) {
    return res.status(400).json({ error: 'Invalid file reference' });
  }

  const absolutePath = path.join(process.cwd(), normalizedPath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Requested PDF file not found' });
  }

  const filename = path.basename(absolutePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
}
