import React from 'react';
import { VolumeIconFor } from './icons.jsx';

export default function VolumeControl({ volume, muted, onChange, onMute }) {
  return (
    <div className="volume-control">
      <button className="pb-btn" onClick={onMute} title={muted ? 'Unmute' : 'Mute'}>
        <VolumeIconFor volume={volume} muted={muted} />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="volume-slider"
        style={{ '--volume-pct': `${Math.round(volume * 100)}%` }}
      />
    </div>
  );
}
