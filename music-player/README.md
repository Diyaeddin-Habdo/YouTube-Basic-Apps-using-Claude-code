# Harmonix — Desktop Music Player

A modern, lightweight desktop music player built with **Electron + Vite + React** and **Howler.js**.

## Features

### Phase 1 — Core audio engine
- Plays MP3, WAV, FLAC, M4A, AAC, OGG, Opus.
- Play / Pause / Stop / Next / Previous controls.
- Interactive seek bar with current time + duration display, drag to scrub.
- Volume slider + single-click mute / unmute that restores prior level.

### Phase 2 — Library & queue
- Add a single file or a whole folder (recursively scans for audio).
- Drag &amp; drop files / folders onto the window.
- Reorderable queue (drag rows up / down).
- Shuffle and Repeat (off → all → one).
- Metadata: title, artist, album, embedded album art via `music-metadata`.

### Phase 3 — UI / UX
- Dark-mode interface inspired by Spotify / Apple Music.
- Quick search bar that filters the current queue by title / artist / album.
- Now Playing view with large album art.

### Phase 4 — System integration
- Hardware media keys (Play/Pause, Next, Previous, Stop) via Electron `globalShortcut`.
- System tray with right-click menu for quick controls.
- Closing the window minimizes to tray; quit via tray menu.
- Toast notification on new track via Electron `Notification`.
- State persistence (queue, last track, volume, repeat/shuffle) via an atomic JSON store in `app.getPath('userData')` (no native compile needed — same restoration behavior as the SQLite design called for).
- Gapless transitions between songs (Howler stream + zero-gap advance).

## Running locally

```bash
npm install
npm run dev
```

`npm run dev` starts Vite on `localhost:5173` and launches Electron pointing at it.

## Project layout

```
electron/
  main.js       Electron main process: window, tray, IPC, SQLite, media keys
  preload.cjs   Bridges safe APIs to the renderer
src/
  main.jsx
  App.jsx
  styles.css
  player/
    audioEngine.js    Howler wrapper exposing events
    playerStore.js    React hook with queue/playback state
  components/
    TitleBar, Sidebar, TrackList, PlayerBar, SeekBar, VolumeControl, NowPlayingPanel
```

## Keyboard shortcuts

- `Space` — Play / Pause
- `Ctrl` + `→` — Next track
- `Ctrl` + `←` — Previous track
- Hardware media keys work even when the window is hidden in the tray.
