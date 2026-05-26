import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from './player/playerStore.js';
import TitleBar from './components/TitleBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import TrackList from './components/TrackList.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import NowPlayingPanel from './components/NowPlayingPanel.jsx';
import { SearchIcon } from './components/icons.jsx';

// Pulls a representative RGB pair from album art so the playing-state background
// can match the current track. Samples the top and bottom halves of a small
// thumbnail to get two visually distinct colors.
function extractColors(imgUrl) {
  return new Promise((resolve) => {
    if (!imgUrl) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = 20, H = 20;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      try { ctx.drawImage(img, 0, 0, W, H); } catch { resolve(null); return; }
      let data;
      try { data = ctx.getImageData(0, 0, W, H).data; } catch { resolve(null); return; }
      const sample = (y0, y1) => {
        let r = 0, g = 0, b = 0, count = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const tr = data[i], tg = data[i + 1], tb = data[i + 2];
            const mx = Math.max(tr, tg, tb), mn = Math.min(tr, tg, tb);
            if (mx < 24 || mn > 232) continue; // skip extremes for richer hues
            r += tr; g += tg; b += tb; count++;
          }
        }
        if (count === 0) return null;
        return `${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`;
      };
      const primary = sample(0, H / 2) || sample(0, H) || '124, 92, 255';
      const secondary = sample(H / 2, H) || primary;
      resolve({ primary, secondary });
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

function useArtColors(artUrl) {
  const [colors, setColors] = useState(null);
  const latest = useRef(0);
  useEffect(() => {
    if (!artUrl) { setColors(null); return; }
    const token = ++latest.current;
    extractColors(artUrl).then((res) => {
      if (token === latest.current) setColors(res);
    });
  }, [artUrl]);
  return colors;
}

export default function App() {
  const { state, actions } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('queue'); // 'queue' | 'favorites' | 'nowplaying'
  const [dragOver, setDragOver] = useState(false);

  const filteredIndices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.queue
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        if (view === 'favorites' && !state.favorites[t.id]) return false;
        if (!q) return true;
        return (t.title || '').toLowerCase().includes(q)
          || (t.artist || '').toLowerCase().includes(q)
          || (t.album || '').toLowerCase().includes(q);
      })
      .map(({ i }) => i);
  }, [searchQuery, state.queue, view, state.favorites]);

  const favoriteCount = useMemo(
    () => state.queue.filter(t => state.favorites[t.id]).length,
    [state.queue, state.favorites]
  );

  const importFiles = useCallback(async () => {
    const tracks = await window.harmonix.pickFiles();
    if (tracks.length) actions.addTracks(tracks);
  }, [actions]);

  const importFolder = useCallback(async () => {
    const tracks = await window.harmonix.pickFolder();
    if (tracks.length) actions.addTracks(tracks);
  }, [actions]);

  // Global drag-drop handler
  useEffect(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const onDragLeave = (e) => {
      if (e.target === document.documentElement || e.clientY <= 0) setDragOver(false);
    };
    const onDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;
      const paths = files
        .map((f) => window.harmonix.getPathForFile(f))
        .filter(Boolean);
      if (paths.length === 0) return;
      const tracks = await window.harmonix.importPaths(paths);
      if (tracks.length) actions.addTracks(tracks);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [actions]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') { e.preventDefault(); actions.togglePlay(); }
      else if (e.code === 'ArrowRight' && e.ctrlKey) actions.next();
      else if (e.code === 'ArrowLeft' && e.ctrlKey) actions.previous();
      else if (e.code === 'KeyL' && (e.ctrlKey || e.metaKey)) {
        const cur = state.queue[state.currentIndex];
        if (cur) actions.toggleFavorite(cur.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, state.queue, state.currentIndex]);

  const currentTrack = state.queue[state.currentIndex] || null;
  const colors = useArtColors(currentTrack?.art || null);

  const auraStyle = {
    '--aura-rgb': colors?.primary || '124, 92, 255',
    '--aura-rgb-2': colors?.secondary || '37, 212, 164',
  };

  return (
    <div
      className={`app ${dragOver ? 'drag-over' : ''} ${state.isPlaying ? 'is-playing' : ''}`}
      style={auraStyle}
    >
      <div className="bg-aura">
        <div className="aura-blob a" />
        <div className="aura-blob b" />
        <div className="aura-blob c" />
      </div>
      <TitleBar />
      <div className="app-body">
        <Sidebar
          view={view}
          onSelectView={setView}
          onImportFiles={importFiles}
          onImportFolder={importFolder}
          onClearQueue={actions.clearQueue}
          queueCount={state.queue.length}
          favoriteCount={favoriteCount}
        />
        <main className="content">
          {view !== 'nowplaying' && (
            <>
              <div className="content-header">
                <div>
                  <h1>{view === 'favorites' ? 'Favorites' : 'Current Queue'}</h1>
                  <p className="subtitle">
                    {view === 'favorites' ? favoriteCount : state.queue.length}
                    {' '}
                    {(view === 'favorites' ? favoriteCount : state.queue.length) === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
                <div className="search-wrap">
                  <span className="search-icon"><SearchIcon /></span>
                  <input
                    className="search"
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <TrackList
                queue={state.queue}
                visibleIndices={filteredIndices}
                currentIndex={state.currentIndex}
                isPlaying={state.isPlaying}
                favorites={state.favorites}
                onTogglePlay={(i) => {
                  if (i === state.currentIndex) actions.togglePlay();
                  else actions.playAt(i);
                }}
                onRemove={(i) => actions.removeTrack(i)}
                onReorder={(from, to) => actions.reorder(from, to)}
                onToggleFavorite={actions.toggleFavorite}
                onImportFiles={view === 'queue' ? importFiles : undefined}
                onImportFolder={view === 'queue' ? importFolder : undefined}
                emptyTitle={view === 'favorites' ? 'No favorites yet' : 'Your queue is empty'}
                emptyHint={
                  view === 'favorites'
                    ? 'Tap the heart on any track to add it here.'
                    : 'Add music to start playing. Drag & drop files or pick a folder.'
                }
              />
            </>
          )}
          {view === 'nowplaying' && (
            <NowPlayingPanel
              track={currentTrack}
              state={state}
              onToggleFavorite={actions.toggleFavorite}
            />
          )}
        </main>
      </div>
      <PlayerBar state={state} actions={actions} track={currentTrack} />
      {dragOver && (
        <div className="drop-overlay">
          <div className="drop-card">
            <div className="drop-icon">↓</div>
            <p>Drop audio files or folders to add them to the queue</p>
          </div>
        </div>
      )}
    </div>
  );
}
