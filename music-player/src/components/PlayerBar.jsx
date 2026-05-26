import React from 'react';
import SeekBar from './SeekBar.jsx';
import VolumeControl from './VolumeControl.jsx';
import {
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  HeartIcon,
  MusicNoteIcon,
} from './icons.jsx';

function formatTime(sec) {
  if (!sec || !Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar({ state, actions, track }) {
  const repeatLabels = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
  const isFav = track ? !!state.favorites[track.id] : false;

  return (
    <footer className="player-bar">
      <div className="pb-track">
        <div className="pb-art" style={track?.art ? { backgroundImage: `url('${track.art}')` } : undefined}>
          {!track?.art && <MusicNoteIcon size={20} />}
        </div>
        <div className="pb-meta">
          <div className="pb-title">{track?.title || 'Nothing playing'}</div>
          <div className="pb-artist">{track?.artist || '—'}</div>
        </div>
        {track && (
          <button
            className={`pb-fav ${isFav ? 'on' : ''}`}
            onClick={() => actions.toggleFavorite(track.id)}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon size={16} filled={isFav} />
          </button>
        )}
      </div>

      <div className="pb-center">
        <div className="pb-controls">
          <button
            className={`pb-btn ${state.shuffle ? 'on' : ''}`}
            onClick={actions.toggleShuffle}
            title="Shuffle"
          ><ShuffleIcon /></button>
          <button className="pb-btn" onClick={actions.previous} title="Previous">
            <PrevIcon />
          </button>
          <button
            className="pb-btn pb-play"
            onClick={actions.togglePlay}
            title={state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
          </button>
          <button className="pb-btn" onClick={actions.next} title="Next">
            <NextIcon />
          </button>
          <button
            className={`pb-btn ${state.repeatMode !== 'off' ? 'on' : ''}`}
            onClick={actions.cycleRepeat}
            title={repeatLabels[state.repeatMode]}
          >
            {state.repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
          </button>
        </div>
        <div className="pb-seek">
          <span className="pb-time">{formatTime(state.seek)}</span>
          <SeekBar
            seek={state.seek}
            duration={state.duration || track?.duration || 0}
            onSeek={actions.seekTo}
          />
          <span className="pb-time">{formatTime(state.duration || track?.duration || 0)}</span>
        </div>
      </div>

      <div className="pb-right">
        <VolumeControl
          volume={state.volume}
          muted={state.muted}
          onChange={actions.setVolume}
          onMute={actions.toggleMute}
        />
      </div>
    </footer>
  );
}
