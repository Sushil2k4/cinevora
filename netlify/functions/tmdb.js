const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const handler = async (event) => {
  const key = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;

  if (!key) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'TMDB_API_KEY is missing in Netlify environment variables.',
      }),
    };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  const path = params.get('path') || '';

  if (!path.startsWith('/')) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'Invalid TMDB path. Expected format: /resource/path',
      }),
    };
  }

  params.delete('path');

  const endpoint = `${TMDB_BASE_URL}${path}?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });

    if (response.status !== 200) {
      console.error(`[TMDB proxy] Non-200 status ${response.status} for ${path}`);
    }

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120',
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'Failed to reach TMDB from Netlify function.',
        details: error?.message || 'Unknown error',
      }),
    };
  }
};
