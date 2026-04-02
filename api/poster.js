const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const path = typeof req.query?.path === 'string' ? req.query.path.trim() : '';

  if (!path.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid poster path.' });
  }

  const endpoint = `${TMDB_IMAGE_BASE_URL}${path}`;
  console.log('[api/poster] request:', endpoint);

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    if (!response.ok) {
      console.error('[api/poster] non-200 status:', response.status);
      return res.status(response.status).json({
        error: `Poster request failed with status ${response.status}`,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[api/poster] fetch error:', error);
    return res.status(502).json({
      error: error?.message || 'Failed to fetch poster image.',
    });
  }
}
