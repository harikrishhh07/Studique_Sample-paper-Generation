import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

const RESOURCES_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'resource-index-drive.json');

// Cache configuration
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ResourceItem {
  name: string;
  fileKey: string;
}

interface Subject {
  name: string;
  semester: string;
  year: number;
  ppts: ResourceItem[];
  pyqs: ResourceItem[];
  syllabus: ResourceItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forceRefresh = req.query.refresh === '1';

  if (!forceRefresh && cachedData && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return res.status(200).json({
      success: true,
      updatedAt: new Date(lastFetchTime).toISOString(),
      source: 'resource-index-drive',
      subjects: cachedData,
    });
  }

  try {
    const fileContent = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
    let data = JSON.parse(fileContent);

    if (!data.success || !data.subjects) {
      throw new Error('Invalid data format in resource-index-drive.json');
    }

    // Transform subjects to match expected format with fileKey
    const finalSubjects = data.subjects.map((subject: any) => ({
      name: subject.name,
      semester: subject.semester || '',
      year: 1,
      ppts: (subject.ppts || []).map((ppt: any) => ({
        name: ppt.name,
        fileKey: ppt.fileId || ppt.url || '',
      })),
      pyqs: (subject.pyqs || []).map((pyq: any) => ({
        name: pyq.name,
        fileKey: pyq.fileId || pyq.url || '',
      })),
      syllabus: (subject.syllabus || []).map((syl: any) => ({
        name: syl.name,
        fileKey: syl.fileId || syl.url || '',
      })),
    }));

    cachedData = finalSubjects;
    lastFetchTime = Date.now();

    res.status(200).json({
      success: true,
      updatedAt: new Date(lastFetchTime).toISOString(),
      source: 'resource-index-drive',
      subjects: finalSubjects,
    });
  } catch (error: any) {
    console.error('Error fetching resource list:', error);
    res.status(500).json({ error: 'Failed to fetch resource list' });
  }
}