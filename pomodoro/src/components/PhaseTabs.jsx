import React from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';
import { PHASES, PHASE_META } from '../lib/time.js';

const ORDER = [PHASES.FOCUS, PHASES.SHORT_BREAK, PHASES.LONG_BREAK];

export default function PhaseTabs() {
  const { phase, setPhase, running } = usePomodoro();

  return (
    <div className="inline-flex bg-black/30 backdrop-blur rounded-full p-1 gap-1 border border-white/10">
      {ORDER.map((p) => {
        const active = p === phase;
        return (
          <button
            key={p}
            type="button"
            disabled={running}
            onClick={() => setPhase(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition
              ${active ? 'bg-white text-neutral-900 shadow' : 'text-white/70 hover:text-white hover:bg-white/10'}
              ${running ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={running ? 'Pause to change phase' : PHASE_META[p].description}
          >
            {PHASE_META[p].label}
          </button>
        );
      })}
    </div>
  );
}
