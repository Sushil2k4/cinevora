import React from 'react';

const MovieCard = ({ movie }) => {
  if (!movie) return null;

  const title = movie?.title || 'Untitled';
  const posterPath = movie?.poster_path;
  const posterSrc = posterPath
    ? `/api/poster?path=${encodeURIComponent(`/t/p/w500/${posterPath}`)}`
    : '/no-movie.png';
  const rating = Number.isFinite(movie?.vote_average)
    ? movie.vote_average.toFixed(1)
    : 'N/A';
  const year = movie?.release_date?.split?.('-')?.[0] || 'N/A';
  const language = movie?.original_language || 'N/A';

  return (
    <div className="movie-card">
      <img
        src={posterSrc}
        alt={title}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = '/no-movie.png';
        }}
      />

      <div className="mt-4">
        <h3>{title}</h3>

        <div className="content">
          <div className="rating">
            <img src="/Star.svg" alt="Star Icon" />
            <p>{rating}</p>
          </div>

          <span>•</span>
          <p className="lang">{language}</p>
          <span>•</span>
          <p className="year">{year}</p>
        </div>
      </div>
    </div>
  );
};
export default MovieCard;
