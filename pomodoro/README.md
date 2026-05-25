# Pomodoro (Electron + React + Vite + Tailwind)

A minimalist, modern Pomodoro desktop app for Windows, macOS, and Linux.

## Features

- Classic Pomodoro cycle (25/5/15) with configurable durations
- Auto long-break every N focus cycles
- Start / Pause / Reset / Skip controls
- Phase-aware dynamic UI (color-changing backgrounds & accent ring)
- Daily pomodoro counter with persistence (resets at midnight)
- Native OS notifications when a phase ends
- Optional alert chime + optional focus ticking sound (WebAudio — no binary assets needed)
- System tray integration: minimize to tray, context menu (Start / Pause / Skip / Reset / Show / Quit), tooltip shows remaining time
- "Always on top" toggle
- Secure Electron defaults (`contextIsolation: true`, `nodeIntegration: false`, all IPC via `preload.js`)

## Project structure

```
e:/Pomodoro
├── electron/
│   ├── main.js            # Electron main process (window, tray, IPC, notifications, config IO)
│   └── preload.js         # Context-isolated IPC bridge → window.pomodoroAPI
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── context/PomodoroContext.jsx
│   ├── components/
│   │   ├── TopBar.jsx
│   │   ├── PhaseTabs.jsx
│   │   ├── TimerDisplay.jsx
│   │   ├── Controls.jsx
│   │   ├── CycleTracker.jsx
│   │   └── SettingsPanel.jsx
│   ├── hooks/useAudio.js
│   ├── lib/time.js
│   └── styles/index.css
├── assets/                # (optional) tray.png etc.
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Scripts

```bash
npm install        # install deps
npm run dev        # vite + electron together (hot reload UI)
npm run build      # build the renderer (vite) into dist/
npm start          # run the production bundle
npm run package    # package distributables (electron-builder)
```

## Configuration & persistence

User settings and the daily pomodoro count are stored in `config.json` inside Electron's per-user `userData` directory (e.g. `%APPDATA%/Pomodoro/config.json` on Windows). The Main process is the single writer; the renderer reads/writes via IPC.

## Security model

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (preload still loads via Node).
- No remote URLs in production; `loadFile(dist/index.html)`.
- `webContents.setWindowOpenHandler` rejects new windows and opens links externally.
- A strict CSP is set in `index.html`.

## Tray icon

Drop a 16×16 (or 32×32) PNG at `assets/tray.png` for a nicer tray icon. The app runs fine without one (uses an empty image).
