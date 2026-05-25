import React from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';

export default function CycleTracker() {
  const { config, focusStreak } = usePomodoro();
  const done = config.completedPomodoros || 0;
  const goal = Math.max(1, config.dailyGoal || 8);
  const cyclesUntilLong = Math.max(1, config.cyclesUntilLongBreak || 4);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs uppercase tracking-widest text-white/50">
        Today {done}/{goal}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: cyclesUntilLong }).map((_, i) => {
          const filled = i < focusStreak;
          return (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition ${
                filled ? 'bg-white' : 'bg-white/20'
              }`}
            />
          );
        })}
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
        Cycle {focusStreak}/{cyclesUntilLong}
      </div>
    </div>
  );
}
