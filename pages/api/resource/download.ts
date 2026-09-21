import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';

// Disable response size limit so large files can be streamed.
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { fileKey, redirect, action, filename } = req.query;

  if (!fileKey || typeof fileKey !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid fileKey parameter' });
  }

  try {
    // Sanitize fileKey
    fileKey = decodeURIComponent(fileKey).trim();

    // Strip leading slashes
    while (fileKey.startsWith('/')) {
      fileKey = fileKey.substring(1);
    }

    // Reject path traversal and null bytes
    if (fileKey.includes('..') || fileKey.includes('\\') || fileKey.includes('\0')) {
      return res.status(400).json({ error: 'Invalid file key' });
    }

    // Build a safe filename for Content-Disposition
    let safeFilename = 'resource.pdf';
    if (typeof filename === 'string' && filename.trim()) {
      safeFilename = filename.trim().replace(/[/\\:*?"<>|]/g, '_');
      if (!safeFilename.toLowerCase().endsWith('.pdf')) safeFilename += '.pdf';
    }

    // Check if it's a Google Drive file ID (starts with '1', no protocol)
    const isGoogleDrive = fileKey.startsWith('1') && !fileKey.includes('://');

    const shouldRedirect = redirect === 'true' || redirect === '1';

    if (isGoogleDrive) {
      if (action === 'download') {
        // Proxy the file server-side so the Drive URL is never exposed to the browser.
        // &confirm=t bypasses the virus-scan interstitial for larger files.
        const exportUrl = `https://drive.google.com/uc?export=download&id=${fileKey}&confirm=t`;

        const upstream = await fetch(exportUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
        });

        if (!upstream.ok || !upstream.body) {
          return res.status(502).json({ error: 'Failed to fetch file from Google Drive' });
        }

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

        // If Drive returned an HTML page (e.g. virus-scan warning page), bail out early
        if (contentType.includes('text/html')) {
          return res.status(502).json({
            error:
              'Google Drive returned a confirmation page instead of the file. The file may be too large for direct download.',
          });
        }

        const contentLength = upstream.headers.get('content-length');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        // Convert the web ReadableStream (returned by undici/fetch in Node 18+) to a
        // Node.js Readable so we can pipe it into the HTTP response.
        const nodeReadable = Readable.fromWeb(
          upstream.body as Parameters<typeof Readable.fromWeb>[0]
        );
        nodeReadable.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) res.status(500).end();
        });
        nodeReadable.pipe(res);
        return;
      } else {
        // For inline viewing the iframe already points to the Drive preview URL directly,
        // but handle the redirect case gracefully too.
        const previewUrl = `https://drive.google.com/file/d/${fileKey}/preview`;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.redirect(302, previewUrl);
        return;
      }
    } else {
      // Non-Drive (S3 / Backblaze) handling
      const contentDisposition =
        action === 'download'
          ? `attachment; filename="${safeFilename}"`
          : `inline; filename="${safeFilename}"`;
      const downloadUrl = `/api/resource/download?fileKey=${encodeURIComponent(fileKey)}&redirect=true&action=${action}`;

      if (shouldRedirect) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.redirect(302, downloadUrl);
      } else {
        res.status(200).json({
          success: true,
          isGoogleDrive,
          downloadUrl,
          contentDisposition,
          expiresInSeconds: 300,
        });
      }
    }
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
}
