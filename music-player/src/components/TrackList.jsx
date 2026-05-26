import React, { useRef, useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  HeartIcon,
  TrashIcon,
  MusicNoteIcon,
} from './icons.jsx';

function formatTime(sec) {
  if (!sec || !Number.isFinite(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackList({
  queue,
  visibleIndices,
  currentIndex,
  isPlaying,
  favorites,
  onTogglePlay,
  onRemove,
  onReorder,
  onToggleFavorite,
  onImportFiles,
  onImportFolder,
  emptyTitle = 'Your queue is empty',
  emptyHint = 'Add music to start playing. Drag & drop files or pick a folder.',
}) {
  const dragFrom = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  if (visibleIndices.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><MusicNoteIcon size={40} /></div>
        <h2>{emptyTitle}</h2>
        <p>{emptyHint}</p>
        {onImportFiles && onImportFolder && (
          <div className="empty-actions">
            <button className="primary-btn" onClick={onImportFiles}>Add Files</button>
            <button className="ghost-btn" onClick={onImportFolder}>Add Folder</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tracklist">
      <div className="tracklist-head">
        <div className="col-num">#</div>
        <div className="col-title">Title</div>
        <div className="col-album">Album</div>
        <div className="col-time">Time</div>
        <div className="col-actions"></div>
      </div>
      <div className="tracklist-body">
        {visibleIndices.map((i, displayIdx) => {
          const t = queue[i];
          const isCurrent = i === currentIndex;
          const isThisPlaying = isCurrent && isPlaying;
          const isFav = !!favorites[t.id];
          return (
            <div
              key={t.id}
              className={`track-row ${isCurrent ? 'current' : ''} ${dragOverIdx === i ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => {
                dragFrom.current = i;
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIdx(null);
                if (dragFrom.current !== null && dragFrom.current !== i) {
                  onReorder(dragFrom.current, i);
                }
                dragFrom.current = null;
              }}
              onDoubleClick={() => onTogglePlay(i)}
            >
              <div className="col-num">
                {isThisPlaying ? (
                  <span className="playing-bars" aria-label="playing">
                    <span /><span /><span />
                  </span>
                ) : (
                  <span>{displayIdx + 1}</span>
                )}
              </div>
              <div className="col-title">
                <div className="art-thumb" style={t.art ? { backgroundImage: `url('${t.art}')` } : undefined}>
                  {!t.art && <MusicNoteIcon size={16} />}
                </div>
                <div className="title-stack">
                  <span className="title-text">{t.title || 'Unknown Title'}</span>
                  <span className="artist-text">{t.artist || 'Unknown Artist'}</span>
                </div>
              </div>
              <div className="col-album">{t.album || '—'}</div>
              <div className="col-time">{formatTime(t.duration)}</div>
              <div className="col-actions">
                <button
                  className={`row-btn favorite ${isFav ? 'on' : ''}`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(t.id); }}
                >
                  <HeartIcon size={13} filled={isFav} />
                </button>
                <button
                  className="row-btn"
                  title={isThisPlaying ? 'Pause' : 'Play'}
                  onClick={(e) => { e.stopPropagation(); onTogglePlay(i); }}
                >
                  {isThisPlaying ? <PauseIcon size={11} /> : <PlayIcon size={11} />}
                </button>
                <button
                  className="row-btn"
                  title="Remove"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
