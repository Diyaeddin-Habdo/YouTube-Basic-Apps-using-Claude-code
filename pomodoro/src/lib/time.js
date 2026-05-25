export const PHASES = Object.freeze({
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
});

export const PHASE_META = {
  [PHASES.FOCUS]: {
    key: PHASES.FOCUS,
    label: 'Focus',
    cssClass: 'phase-focus',
    accent: '#ef4444',
    accentSoft: '#fca5a5',
    description: 'Deep work session'
  },
  [PHASES.SHORT_BREAK]: {
    key: PHASES.SHORT_BREAK,
    label: 'Short Break',
    cssClass: 'phase-short-break',
    accent: '#22c55e',
    accentSoft: '#86efac',
    description: 'Quick breather'
  },
  [PHASES.LONG_BREAK]: {
    key: PHASES.LONG_BREAK,
    label: 'Long Break',
    cssClass: 'phase-long-break',
    accent: '#3b82f6',
    accentSoft: '#93c5fd',
    description: 'Recharge fully'
  }
};

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
