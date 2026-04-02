import React, { useEffect, useRef, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use'
import { updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;



const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const latestRequestRef = useRef(0);

  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    500,
    [searchTerm],
  );
  const fetchMovies = async (query = '') => {
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      if (requestId !== latestRequestRef.current) return;

      setMovieList(results);

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

      console.error(`Error fetching movies : ${error}`);
      // Keep the last successful results on-screen if a later request fails.
    } finally {
      if (requestId !== latestRequestRef.current) return;
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const endpoint = `${API_BASE_URL}/trending/movie/day?api_key=${API_KEY}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Trending fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      console.log('[Trending] raw response:', data);
      console.log('[Trending] results length:', results.length);

      // TMDB response shape is { results: [...] }.
      setTrendingMovies(results);
    } catch (error) {
      console.log(`Error fetching trending movies ${error}`);
      setTrendingMovies([]);
    }
  }

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
                    src={
                      movie?.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                        : '/no-movie.png'
                    }
                    alt={movie?.title || 'Trending movie'}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : (
            movieList?.length > 0 ? (
              <ul>
                {movieList?.map((movie, index) => (
                  <MovieCard key={movie?.id ?? `movie-${index}`} movie={movie} />
                ))}
              </ul>
            ) : (
              <p className="text-light-200">No movies found.</p>
            )
          )}
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