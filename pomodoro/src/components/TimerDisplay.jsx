import React from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';

export default function TimerDisplay() {
  const { remainingLabel, totalSeconds, remaining, phaseMeta, running } = usePomodoro();

  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const size = 260;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={phaseMeta.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 250ms linear, stroke 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`font-mono text-6xl tabular-nums tracking-tight ${running ? 'text-white' : 'text-white/90'}`}
          style={{ textShadow: `0 0 28px ${phaseMeta.accentSoft}55` }}
        >
          {remainingLabel}
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
          {phaseMeta.label}
        </div>
      </div>
    </div>
  );
}
