import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { audio } from './audioEngine.js';

const initialState = {
  queue: [],          // array of track objects
  currentIndex: -1,   // index into queue
  isPlaying: false,
  seek: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  preMuteVolume: 0.8,
  shuffle: false,
  repeatMode: 'off',  // 'off' | 'one' | 'all'
  shuffleOrder: [],   // indices in shuffled order, used when shuffle is on
  shuffleCursor: 0,
  favorites: {},      // { [trackId]: true }
  ready: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const { queue, volume, lastTrackId, repeatMode, shuffle, favorites } = action.payload;
      const idx = lastTrackId ? queue.findIndex(t => t.id === lastTrackId) : -1;
      return {
        ...state,
        queue,
        currentIndex: idx >= 0 ? idx : (queue.length > 0 ? 0 : -1),
        volume,
        repeatMode,
        shuffle,
        favorites: favorites || {},
        ready: true,
      };
    }
    case 'TRACK_UPDATE': {
      const { id, ...patch } = action.payload;
      return {
        ...state,
        queue: state.queue.map(t => (t.id === id ? { ...t, ...patch } : t)),
      };
    }
    case 'TOGGLE_FAVORITE': {
      const id = action.payload;
      const next = { ...state.favorites };
      if (next[id]) delete next[id]; else next[id] = true;
      return { ...state, favorites: next };
    }
    case 'ADD_TRACKS': {
      const incoming = action.payload;
      const existingPaths = new Set(state.queue.map(t => t.path));
      const fresh = incoming.filter(t => !existingPaths.has(t.path));
      const newQueue = [...state.queue, ...fresh];
      return {
        ...state,
        queue: newQueue,
        currentIndex: state.currentIndex === -1 && newQueue.length > 0 ? 0 : state.currentIndex,
      };
    }
    case 'CLEAR_QUEUE':
      return { ...state, queue: [], currentIndex: -1, isPlaying: false };
    case 'REMOVE_TRACK': {
      const idx = action.payload;
      const newQueue = state.queue.filter((_, i) => i !== idx);
      let newIndex = state.currentIndex;
      if (idx < state.currentIndex) newIndex -= 1;
      else if (idx === state.currentIndex) newIndex = Math.min(state.currentIndex, newQueue.length - 1);
      return { ...state, queue: newQueue, currentIndex: newIndex };
    }
    case 'REORDER': {
      const { from, to } = action.payload;
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);
      let newIndex = state.currentIndex;
      if (state.currentIndex === from) newIndex = to;
      else if (from < state.currentIndex && to >= state.currentIndex) newIndex -= 1;
      else if (from > state.currentIndex && to <= state.currentIndex) newIndex += 1;
      return { ...state, queue: newQueue, currentIndex: newIndex };
    }
    case 'SET_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'TICK':
      return { ...state, seek: action.payload.seek, duration: action.payload.duration || state.duration };
    case 'LOADED':
      return { ...state, duration: action.payload.duration };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, muted: action.payload === 0 };
    case 'TOGGLE_MUTE': {
      if (state.muted) {
        return { ...state, muted: false, volume: state.preMuteVolume || 0.8 };
      }
      return { ...state, muted: true, preMuteVolume: state.volume, volume: 0 };
    }
    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle };
    case 'CYCLE_REPEAT': {
      const order = ['off', 'all', 'one'];
      const next = order[(order.indexOf(state.repeatMode) + 1) % order.length];
      return { ...state, repeatMode: next };
    }
    case 'SET_SHUFFLE_ORDER':
      return { ...state, shuffleOrder: action.payload.order, shuffleCursor: action.payload.cursor };
    default:
      return state;
  }
}

function buildShuffleOrder(length, currentIndex) {
  const order = Array.from({ length }, (_, i) => i);
  // Fisher-Yates excluding current
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (currentIndex >= 0) {
    const cur = order.indexOf(currentIndex);
    if (cur !== -1) {
      [order[0], order[cur]] = [order[cur], order[0]];
    }
  }
  return order;
}

export function usePlayer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate from saved session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await window.harmonix.loadSession();
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', payload: session });
      audio.setVolume(session.volume);
    })();
    return () => { cancelled = true; };
  }, []);

  // Hook engine events to dispatch
  useEffect(() => {
    const onPlay = () => dispatch({ type: 'PLAY' });
    const onPause = () => dispatch({ type: 'PAUSE' });
    const onTick = (e) => dispatch({ type: 'TICK', payload: e.detail });
    const onLoaded = (e) => dispatch({ type: 'LOADED', payload: { duration: e.detail.duration } });
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('tick', onTick);
    audio.addEventListener('loaded', onLoaded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('tick', onTick);
      audio.removeEventListener('loaded', onLoaded);
    };
  }, []);

  // Determine the "next" index based on shuffle/repeat
  const computeNextIndex = useCallback((current, queue, shuffle, repeatMode, shuffleOrder, shuffleCursor) => {
    if (queue.length === 0) return -1;
    if (repeatMode === 'one') return current;
    if (shuffle && shuffleOrder.length === queue.length) {
      const next = shuffleCursor + 1;
      if (next < shuffleOrder.length) return shuffleOrder[next];
      return repeatMode === 'all' ? shuffleOrder[0] : -1;
    }
    const next = current + 1;
    if (next < queue.length) return next;
    return repeatMode === 'all' ? 0 : -1;
  }, []);

  const computePrevIndex = useCallback((current, queue, shuffle, shuffleOrder, shuffleCursor) => {
    if (queue.length === 0) return -1;
    if (shuffle && shuffleOrder.length === queue.length) {
      const prev = shuffleCursor - 1;
      if (prev >= 0) return shuffleOrder[prev];
      return shuffleOrder[0];
    }
    return Math.max(0, current - 1);
  }, []);

  // Auto-advance on track end
  useEffect(() => {
    const onEnded = () => {
      const s = stateRef.current;
      const nextIdx = computeNextIndex(s.currentIndex, s.queue, s.shuffle, s.repeatMode, s.shuffleOrder, s.shuffleCursor);
      if (nextIdx === -1) {
        dispatch({ type: 'PAUSE' });
        return;
      }
      if (s.shuffle) {
        dispatch({ type: 'SET_SHUFFLE_ORDER', payload: { order: s.shuffleOrder, cursor: s.shuffleCursor + 1 } });
      }
      dispatch({ type: 'SET_INDEX', payload: nextIdx });
      audio.play(s.queue[nextIdx]);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [computeNextIndex]);

  // Save session whenever significant state changes
  useEffect(() => {
    if (!state.ready) return;
    const current = state.queue[state.currentIndex] || null;
    window.harmonix.saveSession({
      queue: state.queue,
      volume: state.volume,
      lastTrackId: current?.id || null,
      repeatMode: state.repeatMode,
      shuffle: state.shuffle,
      favorites: state.favorites,
    });
  }, [state.ready, state.queue, state.currentIndex, state.volume, state.repeatMode, state.shuffle, state.favorites]);

  // Receive late-arriving metadata enrichment (e.g. album art) from main process
  useEffect(() => {
    const off = window.harmonix.onTrackUpdate((patch) => {
      dispatch({ type: 'TRACK_UPDATE', payload: patch });
    });
    return off;
  }, []);

  // Tell tray + notifications about now playing
  useEffect(() => {
    const current = state.queue[state.currentIndex] || null;
    window.harmonix.nowPlaying({
      title: current?.title || '',
      artist: current?.artist || '',
      album: current?.album || '',
      isPlaying: state.isPlaying,
      notify: false,
    });
  }, [state.queue, state.currentIndex, state.isPlaying]);

  // Build/rebuild shuffle order whenever toggle changes
  useEffect(() => {
    if (state.shuffle && state.queue.length > 0) {
      const order = buildShuffleOrder(state.queue.length, state.currentIndex);
      dispatch({ type: 'SET_SHUFFLE_ORDER', payload: { order, cursor: 0 } });
    } else {
      dispatch({ type: 'SET_SHUFFLE_ORDER', payload: { order: [], cursor: 0 } });
    }
  }, [state.shuffle, state.queue.length]);

  // Public actions ------------------------------------------------------------

  // Actions are closed-over plain functions (no `this`), so passing them
  // directly as event handlers (`onClick={actions.next}`) works correctly.
  const actions = useMemo(() => {
    const playAt = (index, opts = {}) => {
      const { notify = true } = opts;
      const s = stateRef.current;
      const track = s.queue[index];
      if (!track) return;
      dispatch({ type: 'SET_INDEX', payload: index });
      audio.play(track);
      if (notify) {
        window.harmonix.nowPlaying({
          title: track.title,
          artist: track.artist,
          album: track.album,
          isPlaying: true,
          notify: true,
        });
      }
    };

    return {
      addTracks: (tracks) => dispatch({ type: 'ADD_TRACKS', payload: tracks }),
      clearQueue: () => { audio.stop(); dispatch({ type: 'CLEAR_QUEUE' }); },
      removeTrack: (index) => {
        const s = stateRef.current;
        const wasCurrent = index === s.currentIndex;
        dispatch({ type: 'REMOVE_TRACK', payload: index });
        if (wasCurrent) audio.stop();
      },
      reorder: (from, to) => dispatch({ type: 'REORDER', payload: { from, to } }),
      playAt,
      togglePlay: () => {
        const s = stateRef.current;
        if (s.currentIndex < 0 && s.queue.length > 0) { playAt(0); return; }
        if (audio.isPlaying()) {
          audio.pause();
        } else if (audio.current) {
          audio.resume();
        } else if (s.currentIndex >= 0) {
          playAt(s.currentIndex);
        }
      },
      stop: () => audio.stop(),
      next: () => {
        const s = stateRef.current;
        const effectiveRepeat = s.repeatMode === 'one' ? 'all' : s.repeatMode;
        const idx = computeNextIndex(s.currentIndex, s.queue, s.shuffle, effectiveRepeat, s.shuffleOrder, s.shuffleCursor);
        if (idx === -1) return;
        if (s.shuffle) {
          dispatch({ type: 'SET_SHUFFLE_ORDER', payload: { order: s.shuffleOrder, cursor: s.shuffleCursor + 1 } });
        }
        playAt(idx, { notify: true });
      },
      previous: () => {
        const s = stateRef.current;
        if (audio.getSeek() > 3) { audio.seek(0); return; }
        const idx = computePrevIndex(s.currentIndex, s.queue, s.shuffle, s.shuffleOrder, s.shuffleCursor);
        if (idx === -1 || idx === s.currentIndex) { audio.seek(0); return; }
        if (s.shuffle) {
          dispatch({ type: 'SET_SHUFFLE_ORDER', payload: { order: s.shuffleOrder, cursor: Math.max(0, s.shuffleCursor - 1) } });
        }
        playAt(idx, { notify: true });
      },
      seekTo: (seconds) => {
        audio.seek(seconds);
        dispatch({ type: 'TICK', payload: { seek: seconds, duration: stateRef.current.duration } });
      },
      setVolume: (v) => { audio.setVolume(v); dispatch({ type: 'SET_VOLUME', payload: v }); },
      toggleMute: () => {
        const s = stateRef.current;
        if (s.muted) audio.setVolume(s.preMuteVolume || 0.8);
        else audio.setVolume(0);
        dispatch({ type: 'TOGGLE_MUTE' });
      },
      toggleShuffle: () => dispatch({ type: 'TOGGLE_SHUFFLE' }),
      cycleRepeat: () => dispatch({ type: 'CYCLE_REPEAT' }),
      toggleFavorite: (trackId) => dispatch({ type: 'TOGGLE_FAVORITE', payload: trackId }),
    };
  }, [computeNextIndex, computePrevIndex]);

  // Hardware media keys / tray controls
  useEffect(() => {
    const off = window.harmonix.onMediaControl((cmd) => {
      if (cmd === 'playpause') actions.togglePlay();
      else if (cmd === 'next') actions.next();
      else if (cmd === 'previous') actions.previous();
      else if (cmd === 'stop') actions.stop();
    });
    return off;
  }, [actions]);

  return { state, actions };
}
