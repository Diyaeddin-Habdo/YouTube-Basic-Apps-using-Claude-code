import React from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';

export default function Controls() {
  const { running, start, pause, reset, skip } = usePomodoro();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={reset}
        className="btn-icon text-white/80"
        title="Reset current phase"
        aria-label="Reset"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      </button>

      {running ? (
        <button
          type="button"
          onClick={pause}
          className="btn btn-primary px-8 py-3 rounded-full text-base"
          title="Pause"
        >
          Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="btn btn-primary px-8 py-3 rounded-full text-base"
          title="Start"
        >
          Start
        </button>
      )}

      <button
        type="button"
        onClick={skip}
        className="btn-icon text-white/80"
        title="Skip to next phase"
        aria-label="Skip"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>
    </div>
  );
}
