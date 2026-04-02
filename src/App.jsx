import React, { useEffect, useRef, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { updateSearchCount } from './appwrite.js';

const REQUEST_TIMEOUT_MS = 8000;
const buildPosterSrc = (posterPath) =>
  posterPath
    ? `/api/poster?path=${encodeURIComponent(`/t/p/w500/${posterPath}`)}`
    : '/no-movie.png';



const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [moviesError, setMoviesError] = useState('');
  const [trendingError, setTrendingError] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const latestRequestRef = useRef(0);
  const moviesAbortRef = useRef(null);
  const trendingAbortRef = useRef(null);
  const lastMovieQueryRef = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      moviesAbortRef.current?.abort();
      trendingAbortRef.current?.abort();
    };
  }, []);

  const createTimedRequest = () => {
    const controller = new AbortController();
    let didTimeout = false;

    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    return { controller, timeoutId, didTimeoutRef: () => didTimeout };
  };

  const fetchApi = async (path, query = {}, signal) => {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value);
      }
    });

    const options = {
      method: 'GET',
      signal,
    };

    const endpoint = searchParams.toString() ? `${path}?${searchParams.toString()}` : path;

    console.log(`[API] Request -> ${endpoint}`);
    const response = await fetch(endpoint, options);
    const responseText = await response.text();

    let data = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = null;
    }

    console.log(`[API] Response status ${response.status} for ${path}`);
    console.log('[API] Response data:', data || responseText);

    if (response.status !== 200) {
      console.error(`[API] Non-200 status ${response.status} for ${path}`);
    }

    if (!response.ok) {
      console.error('[API] Failed response body:', data || responseText);
      throw new Error(
        `${path} failed with status ${response.status}${data?.error ? `: ${data.error}` : data?.status_message ? `: ${data.status_message}` : ''}`
      );
    }

    return data;
  };

  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    500,
    [searchTerm],
  );
  const fetchMovies = async (query = '') => {
    const requestId = ++latestRequestRef.current;
    moviesAbortRef.current?.abort();
    const { controller, timeoutId, didTimeoutRef } = createTimedRequest();
    moviesAbortRef.current = controller;
    lastMovieQueryRef.current = query;
    setIsLoading(true);
    setMoviesError('');
    console.log(`[Movies] start request (query="${query}")`);
    try {
      const data = query
        ? await fetchApi('/api/movies', { query }, controller.signal)
        : await fetchApi('/api/movies', {}, controller.signal);
      const results = Array.isArray(data?.results) ? data.results : [];

      if (requestId !== latestRequestRef.current) return;

      setMovieList(results);
      console.log(`[Movies] success: ${results.length} items`);

      if (query && results.length > 0) {
        try {
          await updateSearchCount(query, results[0]);
        } catch (trackingError) {
          // Search analytics should not break movie rendering.
          console.warn('Search tracking failed:', trackingError);
        }
      }
    } catch (error) {
      if (requestId !== latestRequestRef.current) return;

      const timedOut = didTimeoutRef();
      console.error('[Movies] fetch failed:', error);
      if (timedOut) {
        setMoviesError(error?.message ? `The request timed out on a slow network. ${error.message}` : 'The request timed out on a slow network.');
      } else if (error?.name === 'AbortError') {
        setMoviesError(error?.message ? `The request was canceled. ${error.message}` : 'The request was canceled.');
      } else {
        setMoviesError(error?.message || 'Could not load movies right now. Please try again in a moment.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (requestId !== latestRequestRef.current) return;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  const loadTrendingMovies = async () => {
    trendingAbortRef.current?.abort();
    const { controller, timeoutId, didTimeoutRef } = createTimedRequest();
    trendingAbortRef.current = controller;
    setTrendingLoading(true);
    setTrendingError('');
    console.log('[Trending] start request');
    try {
      const data = await fetchApi('/api/trending', {}, controller.signal);
      const results = Array.isArray(data?.results) ? data.results : [];

      console.log('[Trending] raw response:', data);
      console.log('[Trending] results length:', results.length);

      // TMDB response shape is { results: [...] }.
      setTrendingMovies(results);
      console.log(`[Trending] success: ${results.length} items`);
    } catch (error) {
      const timedOut = didTimeoutRef();
      console.error('[Trending] fetch failed:', error);
      if (timedOut) {
        setTrendingError(error?.message ? `Trending movies took too long to load. ${error.message}` : 'Trending movies took too long to load.');
      } else if (error?.name === 'AbortError') {
        setTrendingError(error?.message ? `Trending request was canceled. ${error.message}` : 'Trending request was canceled.');
      } else {
        setTrendingError(error?.message || 'Trending movies are temporarily unavailable.');
      }
    }
    finally {
      window.clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setTrendingLoading(false);
      }
    }
  }

  const handleRetryMovies = () => {
    fetchMovies(lastMovieQueryRef.current);
  };

  const handleRetryTrending = () => {
    loadTrendingMovies();
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    console.log('[Trending] useEffect loadTrendingMovies running');
    loadTrendingMovies();
  }, []);

  useEffect(() => {
    if (typeof trendingMovies === 'undefined') {
      console.log('[Trending] state is undefined');
    } else if (Array.isArray(trendingMovies) && trendingMovies.length === 0) {
      console.log('[Trending] state is empty array');
    } else if (Array.isArray(trendingMovies)) {
      console.log('[Trending] state is populated array');
    } else {
      console.log('[Trending] state has unexpected shape:', trendingMovies);
    }
  }, [trendingMovies]);

  return (
    <main>
      <div className="wrapper">
        <header>
          <img src="/hero.png" alt="Hero Banner" />
          <h1>
            Discover <span className="text-gradient">Movies</span> You'll Love
            Without the Noise
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {Array.isArray(trendingMovies) && trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie?.id ?? `trending-${index}`}>
                  <p>{index + 1}</p>
                  <img
                    src={buildPosterSrc(movie?.poster_path)}
                    alt={movie?.title || 'Trending movie'}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/no-movie.png';
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {trendingLoading && (
          <p className="text-light-200 mb-4">Loading trending movies...</p>
        )}

        {trendingError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <p>{trendingError}</p>
            <button
              type="button"
              onClick={handleRetryTrending}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading && movieList.length === 0 && (
            <div className="space-y-3">
              <p className="text-light-200">Loading movies… please wait.</p>
              <Spinner />
            </div>
          )}

          {moviesError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <p>{moviesError}</p>
              <button
                type="button"
                onClick={handleRetryMovies}
                className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && movieList.length > 0 && (
            <p className="mb-4 text-light-200">Refreshing movies… showing the last available results.</p>
          )}

          {movieList?.length > 0 ? (
            <ul>
              {movieList?.map((movie, index) => (
                <MovieCard key={movie?.id ?? `movie-${index}`} movie={movie} />
              ))}
            </ul>
          ) : !isLoading && !moviesError ? (
            <p className="text-light-200">No movies found.</p>
          ) : null}
        </section>
      </div>

      <footer className="mt-24 py-14 bg-dark-100/40 border-t border-light-100/10 text-center backdrop-blur-sm">
        <p className="text-base text-gray-300">
          Built and Maintained by{" "}
          <span className="text-light-100 font-semibold">
      Sushil
    </span>
        </p>

        <a
          href="https://github.com/Sushil2k4"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-light-200 hover:text-white transition duration-300 text-sm"
        >
          View on GitHub →
        </a>

        <p className="mt-6 text-xs text-gray-500 tracking-wide">
          Powered by TMDB API & Appwrite
        </p>
      </footer>
    </main>
  );
}

export default App