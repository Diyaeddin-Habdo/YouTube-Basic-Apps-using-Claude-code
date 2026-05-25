import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PHASES, PHASE_META, formatTime } from '../lib/time.js';
import { useAudio } from '../hooks/useAudio.js';

const PomodoroContext = createContext(null);

const api = (typeof window !== 'undefined' && window.pomodoroAPI) || null;

const FALLBACK_CONFIG = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStartNextPhase: true,
  enableTickingSound: false,
  enableAlertSound: true,
  alwaysOnTop: false,
  completedPomodoros: 0,
  dailyGoal: 8,
  lastResetDate: new Date().toISOString().slice(0, 10)
};

function phaseDurationSeconds(phase, cfg) {
  if (phase === PHASES.FOCUS) return cfg.focusMinutes * 60;
  if (phase === PHASES.SHORT_BREAK) return cfg.shortBreakMinutes * 60;
  if (phase === PHASES.LONG_BREAK) return cfg.longBreakMinutes * 60;
  return cfg.focusMinutes * 60;
}

export function PomodoroProvider({ children }) {
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [phase, setPhase] = useState(PHASES.FOCUS);
  const [remaining, setRemaining] = useState(FALLBACK_CONFIG.focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [focusStreak, setFocusStreak] = useState(0); // consecutive focus completions toward long-break

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const audio = useAudio();

  // Load persisted config on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!api) {
        setConfigLoaded(true);
        return;
      }
      try {
        const loaded = await api.getConfig();
        if (mounted && loaded) {
          setConfig(loaded);
          setRemaining(phaseDurationSeconds(PHASES.FOCUS, loaded));
        }
      } catch (err) {
        console.error('[ctx] config load failed', err);
      } finally {
        if (mounted) setConfigLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist config helper
  const persistConfig = useCallback(async (partial) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    if (api) {
      try {
        const next = await api.setConfig(partial);
        if (next) setConfig(next);
      } catch (err) {
        console.error('[ctx] config save failed', err);
      }
    }
  }, []);

  // Stop ticker
  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    audio.stopTicking();
  }, [audio]);

  // Transition to next phase
  const advancePhase = useCallback(
    (current, streak) => {
      let nextPhase = PHASES.FOCUS;
      let nextStreak = streak;

      if (current === PHASES.FOCUS) {
        nextStreak = streak + 1;
        if (nextStreak >= config.cyclesUntilLongBreak) {
          nextPhase = PHASES.LONG_BREAK;
          nextStreak = 0;
        } else {
          nextPhase = PHASES.SHORT_BREAK;
        }
      } else {
        nextPhase = PHASES.FOCUS;
      }

      return { nextPhase, nextStreak };
    },
    [config.cyclesUntilLongBreak]
  );

  const onPhaseComplete = useCallback(() => {
    const wasFocus = phase === PHASES.FOCUS;
    const { nextPhase, nextStreak } = advancePhase(phase, focusStreak);

    if (config.enableAlertSound) audio.playAlert();
    audio.stopTicking();

    if (api) {
      api.notify({
        title: wasFocus ? 'Focus session complete' : 'Break finished',
        body: wasFocus
          ? `Time to ${nextPhase === PHASES.LONG_BREAK ? 'take a long break' : 'take a short break'}.`
          : 'Back to focus — let’s go.'
      });
    }

    if (wasFocus) {
      const newCount = (config.completedPomodoros || 0) + 1;
      persistConfig({ completedPomodoros: newCount });
    }

    setFocusStreak(nextStreak);
    setPhase(nextPhase);
    const dur = phaseDurationSeconds(nextPhase, config);
    setRemaining(dur);

    if (config.autoStartNextPhase) {
      endTimeRef.current = Date.now() + dur * 1000;
      setRunning(true);
    } else {
      stopTicker();
      setRunning(false);
    }
  }, [phase, focusStreak, config, advancePhase, audio, persistConfig, stopTicker]);

  // Ticker (drift-resistant using endTime)
  useEffect(() => {
    if (!running) return;
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + remaining * 1000;
    }
    if (phase === PHASES.FOCUS && config.enableTickingSound) {
      audio.startTicking();
    } else {
      audio.stopTicking();
    }

    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onPhaseComplete();
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, config.enableTickingSound]);

  // ------ Public controls ------
  const start = useCallback(() => {
    if (running) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }, [running, remaining]);

  const pause = useCallback(() => {
    if (!running) return;
    if (endTimeRef.current) {
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemaining(left);
    }
    setRunning(false);
    stopTicker();
  }, [running, stopTicker]);

  const reset = useCallback(() => {
    stopTicker();
    setRunning(false);
    setRemaining(phaseDurationSeconds(phase, config));
  }, [phase, config, stopTicker]);

  const skip = useCallback(() => {
    stopTicker();
    setRunning(false);
    const { nextPhase, nextStreak } = advancePhase(phase, focusStreak);
    setFocusStreak(nextStreak);
    setPhase(nextPhase);
    setRemaining(phaseDurationSeconds(nextPhase, config));
  }, [phase, focusStreak, config, advancePhase, stopTicker]);

  const setPhaseManual = useCallback(
    (p) => {
      stopTicker();
      setRunning(false);
      setPhase(p);
      setRemaining(phaseDurationSeconds(p, config));
    },
    [config, stopTicker]
  );

  const toggleAlwaysOnTop = useCallback(async () => {
    const next = !config.alwaysOnTop;
    if (api) {
      try {
        await api.setAlwaysOnTop(next);
      } catch (err) {
        console.error('[ctx] always-on-top failed', err);
      }
    }
    setConfig((prev) => ({ ...prev, alwaysOnTop: next }));
  }, [config.alwaysOnTop]);

  // ------ When config durations change, refresh remaining if not running ------
  useEffect(() => {
    if (!running) {
      setRemaining(phaseDurationSeconds(phase, config));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.focusMinutes, config.shortBreakMinutes, config.longBreakMinutes]);

  // ------ Sync tray + tooltip from renderer ------
  useEffect(() => {
    if (!api) return;
    api.updateTray({
      phaseLabel: PHASE_META[phase].label,
      remainingLabel: formatTime(remaining),
      running
    });
  }, [phase, remaining, running]);

  // ------ Tray commands listener ------
  useEffect(() => {
    if (!api) return;
    const off = api.onTrayCommand((command) => {
      if (command === 'start') start();
      else if (command === 'pause') pause();
      else if (command === 'reset') reset();
      else if (command === 'skip') skip();
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, [start, pause, reset, skip]);

  const value = useMemo(
    () => ({
      config,
      configLoaded,
      phase,
      phaseMeta: PHASE_META[phase],
      remaining,
      remainingLabel: formatTime(remaining),
      totalSeconds: phaseDurationSeconds(phase, config),
      running,
      focusStreak,
      start,
      pause,
      reset,
      skip,
      setPhase: setPhaseManual,
      updateConfig: persistConfig,
      toggleAlwaysOnTop
    }),
    [
      config,
      configLoaded,
      phase,
      remaining,
      running,
      focusStreak,
      start,
      pause,
      reset,
      skip,
      setPhaseManual,
      persistConfig,
      toggleAlwaysOnTop
    ]
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used inside <PomodoroProvider>');
  return ctx;
}
