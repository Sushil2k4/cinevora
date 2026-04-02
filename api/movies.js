const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.VITE_TMDB_API_KEY;

  if (!token) {
    return res.status(500).json({
      error: 'VITE_TMDB_API_KEY is missing on the server.',
    });
  }

  const query = typeof req.query?.query === 'string' ? req.query.query.trim() : '';
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set('query', query);
  }

  const endpoint = query
    ? `${TMDB_BASE_URL}/search/movie?${searchParams.toString()}`
    : `${TMDB_BASE_URL}/movie/popular`;

  console.log('[api/movies] request:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await response.text();
    let data = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = null;
    }

    console.log('[api/movies] response status:', response.status);
    console.log('[api/movies] response data:', data || responseText);

    if (!response.ok) {
      return res.status(response.status).json(
        data || {
          error: `TMDB movies request failed with status ${response.status}`,
        }
      );
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[api/movies] fetch error:', error);
    return res.status(502).json({
      error: error?.message || 'Failed to fetch movies from TMDB.',
    });
  }
}
