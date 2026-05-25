import { useCallback, useEffect, useRef } from 'react';

// Generate a short alert tone via WebAudio so we don't ship binary assets.
function playTone({ ctx, freq = 880, duration = 0.25, type = 'sine', volume = 0.4, when = 0 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + when);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + duration + 0.05);
}

export function useAudio() {
  const ctxRef = useRef(null);
  const tickIntervalRef = useRef(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const playAlert = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    // Cheerful 3-note chime
    playTone({ ctx, freq: 660, duration: 0.18, volume: 0.35, when: 0 });
    playTone({ ctx, freq: 880, duration: 0.18, volume: 0.35, when: 0.18 });
    playTone({ ctx, freq: 1175, duration: 0.32, volume: 0.4, when: 0.36 });
  }, [ensureCtx]);

  const playTick = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone({ ctx, freq: 1000, duration: 0.04, type: 'square', volume: 0.06 });
  }, [ensureCtx]);

  const startTicking = useCallback(() => {
    if (tickIntervalRef.current) return;
    tickIntervalRef.current = setInterval(() => playTick(), 1000);
  }, [playTick]);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTicking(), [stopTicking]);

  return { playAlert, startTicking, stopTicking };
}
