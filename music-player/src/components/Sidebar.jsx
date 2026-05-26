import React from 'react';
import { MusicNoteIcon, DiscIcon, HeartIcon, PlusIcon, FolderPlusIcon, TrashIcon } from './icons.jsx';

export default function Sidebar({
  view,
  onSelectView,
  onImportFiles,
  onImportFolder,
  onClearQueue,
  queueCount,
  favoriteCount,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Library</h3>
        <button
          className={`nav-item ${view === 'queue' ? 'active' : ''}`}
          onClick={() => onSelectView('queue')}
        >
          <span className="nav-icon"><MusicNoteIcon /></span>
          <span>Queue</span>
          <span className="nav-count">{queueCount}</span>
        </button>
        <button
          className={`nav-item ${view === 'favorites' ? 'active' : ''}`}
          onClick={() => onSelectView('favorites')}
        >
          <span className="nav-icon"><HeartIcon size={16} filled={view === 'favorites'} /></span>
          <span>Favorites</span>
          <span className="nav-count">{favoriteCount}</span>
        </button>
        <button
          className={`nav-item ${view === 'nowplaying' ? 'active' : ''}`}
          onClick={() => onSelectView('nowplaying')}
        >
          <span className="nav-icon"><DiscIcon /></span>
          <span>Now Playing</span>
        </button>
      </div>
      <div className="sidebar-section">
        <h3>Add Music</h3>
        <button className="sidebar-btn" onClick={onImportFiles}>
          <PlusIcon /> Add Files
        </button>
        <button className="sidebar-btn" onClick={onImportFolder}>
          <FolderPlusIcon /> Add Folder
        </button>
        <button className="sidebar-btn danger" onClick={onClearQueue} disabled={!queueCount}>
          <TrashIcon /> Clear Queue
        </button>
      </div>
      <div className="sidebar-footer">
        <p>Drop audio files or folders<br />anywhere in the window.</p>
      </div>
    </aside>
  );
}
