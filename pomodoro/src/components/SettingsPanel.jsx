import React, { useEffect, useState } from 'react';
import { usePomodoro } from '../context/PomodoroContext.jsx';

function NumberField({ label, value, min = 1, max = 180, onChange, suffix }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-white/80">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-20 px-2 py-1 rounded-md bg-white/10 text-right text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        {suffix && <span className="text-xs text-white/50">{suffix}</span>}
      </div>
    </label>
  );
}

function ToggleField({ label, value, onChange, description }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <div className="text-sm text-white/80">{label}</div>
        {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-white' : 'bg-white/20'}`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 ${value ? 'left-5' : 'left-0.5'} w-5 h-5 rounded-full bg-neutral-900 transition-all`}
        />
      </button>
    </div>
  );
}

export default function SettingsPanel({ onClose }) {
  const { config, updateConfig } = usePomodoro();
  const [form, setForm] = useState({
    focusMinutes: config.focusMinutes,
    shortBreakMinutes: config.shortBreakMinutes,
    longBreakMinutes: config.longBreakMinutes,
    cyclesUntilLongBreak: config.cyclesUntilLongBreak,
    dailyGoal: config.dailyGoal,
    autoStartNextPhase: config.autoStartNextPhase,
    enableAlertSound: config.enableAlertSound,
    enableTickingSound: config.enableTickingSound
  });

  useEffect(() => {
    setForm({
      focusMinutes: config.focusMinutes,
      shortBreakMinutes: config.shortBreakMinutes,
      longBreakMinutes: config.longBreakMinutes,
      cyclesUntilLongBreak: config.cyclesUntilLongBreak,
      dailyGoal: config.dailyGoal,
      autoStartNextPhase: config.autoStartNextPhase,
      enableAlertSound: config.enableAlertSound,
      enableTickingSound: config.enableTickingSound
    });
  }, [config]);

  const apply = async () => {
    await updateConfig(form);
    onClose?.();
  };

  const resetCounter = async () => {
    await updateConfig({ completedPomodoros: 0 });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm no-drag">
      <div className="w-[90%] max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon text-white/70"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-white/5">
          <section className="py-2">
            <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Durations</div>
            <NumberField
              label="Focus"
              value={form.focusMinutes}
              onChange={(v) => setForm((s) => ({ ...s, focusMinutes: v }))}
              suffix="min"
            />
            <NumberField
              label="Short break"
              value={form.shortBreakMinutes}
              onChange={(v) => setForm((s) => ({ ...s, shortBreakMinutes: v }))}
              suffix="min"
            />
            <NumberField
              label="Long break"
              value={form.longBreakMinutes}
              onChange={(v) => setForm((s) => ({ ...s, longBreakMinutes: v }))}
              suffix="min"
            />
            <NumberField
              label="Long break after"
              value={form.cyclesUntilLongBreak}
              min={2}
              max={12}
              onChange={(v) => setForm((s) => ({ ...s, cyclesUntilLongBreak: v }))}
              suffix="cycles"
            />
            <NumberField
              label="Daily goal"
              value={form.dailyGoal}
              min={1}
              max={32}
              onChange={(v) => setForm((s) => ({ ...s, dailyGoal: v }))}
              suffix="pomodoros"
            />
          </section>

          <section className="py-2">
            <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Behavior</div>
            <ToggleField
              label="Auto-start next phase"
              value={form.autoStartNextPhase}
              onChange={(v) => setForm((s) => ({ ...s, autoStartNextPhase: v }))}
              description="Automatically begin the next phase when the timer ends."
            />
            <ToggleField
              label="Alert sound"
              value={form.enableAlertSound}
              onChange={(v) => setForm((s) => ({ ...s, enableAlertSound: v }))}
              description="Play a soft chime when a phase completes."
            />
            <ToggleField
              label="Ticking sound (focus)"
              value={form.enableTickingSound}
              onChange={(v) => setForm((s) => ({ ...s, enableTickingSound: v }))}
              description="Quiet metronome tick during focus sessions."
            />
          </section>

          <section className="py-3 flex items-center justify-between">
            <div className="text-xs text-white/50">
              Today's pomodoros: <span className="text-white">{config.completedPomodoros || 0}</span>
            </div>
            <button
              type="button"
              onClick={resetCounter}
              className="btn btn-ghost text-xs"
            >
              Reset count
            </button>
          </section>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={apply} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
