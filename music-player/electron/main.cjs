const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, globalShortcut, Notification, protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

// music-metadata is ESM-only; bridge it in from CJS.
let parseFilePromise = null;
function getParseFile() {
  if (!parseFilePromise) {
    parseFilePromise = import('music-metadata').then((m) => m.parseFile);
  }
  return parseFilePromise;
}

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let tray = null;
let isQuitting = false;
let storePath = null;
let store = null;

const SUPPORTED_EXTS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus']);

// Register custom scheme before app is ready. Marking it as privileged + streaming
// lets <audio>/MediaSource access it and lets Range requests work for seeking.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media-loader',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

const DEFAULT_STORE = {
  settings: {
    volume: 0.8,
    lastTrackId: null,
    repeatMode: 'off',
    shuffle: false,
  },
  tracks: {},
  queue: [],
  favorites: {},
};

function initStore() {
  storePath = path.join(app.getPath('userData'), 'harmonix.json');
  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    const parsed = JSON.parse(raw);
    store = {
      settings: { ...DEFAULT_STORE.settings, ...(parsed.settings || {}) },
      tracks: parsed.tracks || {},
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      favorites: parsed.favorites || {},
    };
  } catch {
    store = JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

let writeTimer = null;
function persistStore() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      const tmp = `${storePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(store));
      fs.renameSync(tmp, storePath);
    } catch (err) {
      console.error('Failed to persist store', err);
    }
    writeTimer = null;
  }, 200);
}

function saveTracks(tracks) {
  for (const t of tracks) {
    store.tracks[t.id] = {
      id: t.id,
      path: t.path,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      added_at: t.added_at,
    };
  }
  persistStore();
}

function saveQueue(trackIds) {
  store.queue = [...trackIds];
  persistStore();
}

function loadSavedSession() {
  const tracks = store.queue
    .map(id => store.tracks[id])
    .filter(Boolean);
  return {
    queue: tracks,
    volume: store.settings.volume,
    lastTrackId: store.settings.lastTrackId,
    repeatMode: store.settings.repeatMode,
    shuffle: store.settings.shuffle,
    favorites: store.favorites || {},
  };
}

// Re-parse a track to recover transient metadata (album art) that isn't persisted
// in the JSON store. Returns null on failure or when no art is embedded.
async function enrichTrackArt(track) {
  try {
    const parseFile = await getParseFile();
    const meta = await parseFile(track.path, { duration: false, skipCovers: false });
    const c = meta.common || {};
    if (c.picture && c.picture.length > 0) {
      const pic = c.picture[0];
      const b64 = Buffer.from(pic.data).toString('base64');
      return `data:${pic.format};base64,${b64}`;
    }
  } catch { /* track file missing or unreadable */ }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 880,
    minHeight: 560,
    backgroundColor: '#0e0e12',
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Harmonix',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

const FALLBACK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAQElEQVR4AWMAAUaG/wxQwMTAxoBb4D8DA5JCJgYWBhYG+v8MwoYGiP8MDIwsDIwM/wkZQ/A/AwMjAwMjGyMTPwMA0vYG+9zXKAYAAAAASUVORK5CYII=';

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  let icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
  if (icon.isEmpty()) icon = nativeImage.createFromDataURL(FALLBACK_ICON);
  tray = new Tray(icon);
  tray.setToolTip('Harmonix');
  refreshTrayMenu();
  tray.on('double-click', () => mainWindow && mainWindow.show());
}

function refreshTrayMenu(state) {
  if (!tray) return;
  const s = state || {};
  const menu = Menu.buildFromTemplate([
    { label: s.title ? `Now: ${s.title}` : 'Harmonix', enabled: false },
    { type: 'separator' },
    { label: s.isPlaying ? 'Pause' : 'Play', click: () => mainWindow && mainWindow.webContents.send('media-control', 'playpause') },
    { label: 'Next', click: () => mainWindow && mainWindow.webContents.send('media-control', 'next') },
    { label: 'Previous', click: () => mainWindow && mainWindow.webContents.send('media-control', 'previous') },
    { type: 'separator' },
    { label: 'Show Window', click: () => mainWindow && mainWindow.show() },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function registerMediaKeys() {
  const send = (cmd) => mainWindow && mainWindow.webContents.send('media-control', cmd);
  globalShortcut.register('MediaPlayPause', () => send('playpause'));
  globalShortcut.register('MediaNextTrack', () => send('next'));
  globalShortcut.register('MediaPreviousTrack', () => send('previous'));
  globalShortcut.register('MediaStop', () => send('stop'));
}

const MIME_BY_EXT = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
};

function nodeStreamToWebStream(nodeStream) {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() { nodeStream.destroy(); },
  });
}

function registerMediaProtocol() {
  // Custom protocol that serves local audio files with proper Range support so
  // seeking inside the <audio> element works without re-downloading the file.
  protocol.handle('media-loader', async (request) => {
    try {
      const url = new URL(request.url);
      const filePath = decodeURIComponent(url.pathname.replace(/^\//, ''));
      const stat = await fs.promises.stat(filePath);
      const total = stat.size;
      const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        let start = match && match[1] ? parseInt(match[1], 10) : 0;
        let end = match && match[2] ? parseInt(match[2], 10) : total - 1;
        if (Number.isNaN(start) || start < 0) start = 0;
        if (Number.isNaN(end) || end >= total) end = total - 1;
        if (start > end) start = end;
        const nodeStream = fs.createReadStream(filePath, { start, end });
        return new Response(nodeStreamToWebStream(nodeStream), {
          status: 206,
          headers: {
            'Content-Type': mime,
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(end - start + 1),
            'Cache-Control': 'no-store',
          },
        });
      }

      const nodeStream = fs.createReadStream(filePath);
      return new Response(nodeStreamToWebStream(nodeStream), {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(total),
          'Cache-Control': 'no-store',
        },
      });
    } catch (err) {
      console.error('media-loader protocol error', err);
      return new Response('Not Found', { status: 404 });
    }
  });
}

async function walkForAudio(target) {
  const out = [];
  const stat = await fs.promises.stat(target).catch(() => null);
  if (!stat) return out;
  if (stat.isFile()) {
    if (SUPPORTED_EXTS.has(path.extname(target).toLowerCase())) out.push(target);
    return out;
  }
  const entries = await fs.promises.readdir(target, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      const inner = await walkForAudio(full);
      out.push(...inner);
    } else if (entry.isFile() && SUPPORTED_EXTS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function makeId(filePath) {
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    hash = ((hash << 5) - hash + filePath.charCodeAt(i)) | 0;
  }
  return `t_${Math.abs(hash).toString(36)}_${path.basename(filePath).replace(/\W/g, '').slice(0, 8)}`;
}

async function buildTrack(filePath) {
  const base = {
    id: makeId(filePath),
    path: filePath,
    title: path.basename(filePath, path.extname(filePath)),
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    duration: 0,
    art: null,
    added_at: Date.now(),
  };
  try {
    const parseFile = await getParseFile();
    const meta = await parseFile(filePath, { duration: true });
    const c = meta.common || {};
    base.title = c.title || base.title;
    base.artist = c.artist || (c.artists && c.artists[0]) || base.artist;
    base.album = c.album || base.album;
    base.duration = (meta.format && meta.format.duration) || 0;
    if (c.picture && c.picture.length > 0) {
      const pic = c.picture[0];
      const b64 = Buffer.from(pic.data).toString('base64');
      base.art = `data:${pic.format};base64,${b64}`;
    }
  } catch (err) {
    console.warn('metadata failed for', filePath, err.message);
  }
  return base;
}

app.whenReady().then(async () => {
  initStore();
  registerMediaProtocol();
  createWindow();
  createTray();
  registerMediaKeys();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) app.quit();
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });

// IPC handlers ----------------------------------------------------------------

ipcMain.handle('pick-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: [...SUPPORTED_EXTS].map(e => e.slice(1)) }],
  });
  if (result.canceled) return [];
  const tracks = [];
  for (const file of result.filePaths) tracks.push(await buildTrack(file));
  saveTracks(tracks);
  return tracks;
});

ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths[0]) return [];
  const files = await walkForAudio(result.filePaths[0]);
  const tracks = [];
  for (const f of files) tracks.push(await buildTrack(f));
  saveTracks(tracks);
  return tracks;
});

ipcMain.handle('import-paths', async (_evt, paths) => {
  const allFiles = [];
  for (const p of paths) {
    const found = await walkForAudio(p);
    allFiles.push(...found);
  }
  const tracks = [];
  for (const f of allFiles) tracks.push(await buildTrack(f));
  saveTracks(tracks);
  return tracks;
});

ipcMain.handle('load-session', async () => {
  const session = loadSavedSession();
  // Kick off background art enrichment so the UI shows the queue instantly,
  // then album art pops in as each track's metadata is parsed.
  for (const track of session.queue) {
    enrichTrackArt(track).then((art) => {
      if (art && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('track-update', { id: track.id, art });
      }
    });
  }
  return session;
});

ipcMain.on('save-session', (_evt, payload) => {
  if (payload.queue) {
    saveTracks(payload.queue);
    saveQueue(payload.queue.map(t => t.id));
  }
  if (typeof payload.volume === 'number') store.settings.volume = payload.volume;
  if (payload.lastTrackId !== undefined) store.settings.lastTrackId = payload.lastTrackId;
  if (payload.repeatMode) store.settings.repeatMode = payload.repeatMode;
  if (typeof payload.shuffle === 'boolean') store.settings.shuffle = payload.shuffle;
  if (payload.favorites) store.favorites = payload.favorites;
  persistStore();
});

ipcMain.on('now-playing', (_evt, state) => {
  refreshTrayMenu(state);
  if (state.notify && state.title) {
    try {
      const n = new Notification({
        title: state.title,
        body: `${state.artist || 'Unknown Artist'} — ${state.album || ''}`.trim(),
        silent: true,
      });
      n.show();
    } catch (err) { /* notifications may be unsupported on the platform */ }
  }
});

ipcMain.on('window-action', (_evt, action) => {
  if (!mainWindow) return;
  if (action === 'minimize-tray') mainWindow.hide();
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
  if (action === 'close') mainWindow.close();
});
