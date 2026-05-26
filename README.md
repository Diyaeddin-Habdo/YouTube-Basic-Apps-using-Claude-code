# YouTube Basic Apps using Claude Code

This repository contains simple desktop/web applications that I built from scratch with Claude Code for YouTube videos. Each folder is an independent application.

## Applications

| Folder | Description | Stack |
|---|---|---|
| [pomodoro/](./pomodoro/) | A modern Pomodoro desktop application with focus/break cycles, system tray integration, native notifications, and customizable timers. | Electron · React · Vite · Tailwind |
| [music-player/](./music-player/) | Harmonix — a desktop music player with playback for MP3/WAV/FLAC/M4A, queue + favorites, drag-drop import, media-key/tray controls, persistent state, and an art-derived animated background. | Electron · React · Vite · Howler.js |

## Usage

Run each application inside its own folder:

```bash
cd <app-folder>
npm install
npm run dev
