import React from 'react';
import { MusicNoteIcon, HeartIcon } from './icons.jsx';

export default function NowPlayingPanel({ track, state, onToggleFavorite }) {
  if (!track) {
    return (
      <div className="np-panel empty">
        <p>Nothing is playing right now.</p>
      </div>
    );
  }
  const isFav = !!state.favorites[track.id];
  return (
    <div className="np-panel">
      <div className="np-art" style={track.art ? { backgroundImage: `url('${track.art}')` } : undefined}>
        {!track.art && <span className="np-art-placeholder"><MusicNoteIcon size={88} /></span>}
      </div>
      <div className="np-info">
        <h1>{track.title || 'Unknown Title'}</h1>
        <h2>{track.artist || 'Unknown Artist'}</h2>
        <p>{track.album || '—'}</p>
        <div className="np-status">
          <span className={`np-dot ${state.isPlaying ? 'playing' : ''}`} />
          {state.isPlaying ? 'Playing' : 'Paused'}
        </div>
        <button
          className={`np-fav ${isFav ? 'on' : ''}`}
          onClick={() => onToggleFavorite(track.id)}
        >
          <HeartIcon size={16} filled={isFav} />
          {isFav ? 'Favorited' : 'Add to favorites'}
        </button>
      </div>
    </div>
  );
}
