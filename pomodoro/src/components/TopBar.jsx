import React from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';

export default function TopBar({ onOpenSettings }) {
  const { config, toggleAlwaysOnTop } = usePomodoro();
  const pinned = !!config.alwaysOnTop;

  return (
    <header className="flex items-center justify-between px-4 py-3 drag-region">
      <div className="text-sm font-semibold tracking-widest text-white/70 uppercase">
        Pomodoro
      </div>
      <div className="flex items-center gap-2 no-drag">
        <button
          type="button"
          onClick={toggleAlwaysOnTop}
          title={pinned ? 'Unpin from top' : 'Keep on top'}
          className={`btn-icon ${pinned ? 'bg-white/30 text-white' : 'text-white/70'}`}
          aria-pressed={pinned}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v6" />
            <path d="M5 9h14l-2 6H7L5 9z" />
            <path d="M9 15v6" />
            <path d="M15 15v6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="btn-icon text-white/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .68.4 1.27 1 1.51H21a2 2 0 1 1 0 4h-.09c-.6.24-1 .83-1 1.49z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
