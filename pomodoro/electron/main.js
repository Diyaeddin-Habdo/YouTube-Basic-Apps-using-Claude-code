const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5173';

let mainWindow = null;
let tray = null;
let isQuitting = false;
let _configPath = null;

function getConfigPath() {
  if (!_configPath) {
    _configPath = path.join(app.getPath('userData'), 'config.json');
  }
  return _configPath;
}

const DEFAULT_CONFIG = {
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

function loadConfig() {
  try {
    if (!fs.existsSync(getConfigPath())) {
      fs.writeFileSync(getConfigPath(), JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(getConfigPath(), 'utf-8');
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_CONFIG, ...parsed };
    const today = new Date().toISOString().slice(0, 10);
    if (merged.lastResetDate !== today) {
      merged.completedPomodoros = 0;
      merged.lastResetDate = today;
      fs.writeFileSync(getConfigPath(), JSON.stringify(merged, null, 2), 'utf-8');
    }
    return merged;
  } catch (err) {
    console.error('[config] failed to load, using defaults:', err);
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(partial) {
  try {
    const current = loadConfig();
    const next = { ...current, ...partial };
    fs.writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), 'utf-8');
    return next;
  } catch (err) {
    console.error('[config] save failed:', err);
    return null;
  }
}

function buildTrayIcon() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  const empty = nativeImage.createEmpty();
  return empty;
}

function createMainWindow() {
  const config = loadConfig();
  mainWindow = new BrowserWindow({
    width: 420,
    height: 620,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: '#0a0a0a',
    show: false,
    frame: true,
    resizable: true,
    alwaysOnTop: !!config.alwaysOnTop,
    title: 'Pomodoro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (process.platform === 'darwin') app.dock?.hide?.();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  if (process.platform === 'darwin') app.dock?.show?.();
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function buildTrayMenu(state) {
  const remaining = state?.remainingLabel ?? '--:--';
  const phaseLabel = state?.phaseLabel ?? 'Idle';
  return Menu.buildFromTemplate([
    { label: `${phaseLabel} - ${remaining}`, enabled: false },
    { type: 'separator' },
    { label: 'Show', click: showWindow },
    { label: 'Start / Resume', click: () => sendToRenderer('tray:command', 'start') },
    { label: 'Pause', click: () => sendToRenderer('tray:command', 'pause') },
    { label: 'Skip', click: () => sendToRenderer('tray:command', 'skip') },
    { label: 'Reset', click: () => sendToRenderer('tray:command', 'reset') },
    { type: 'separator' },
    {
      label: 'Quit Pomodoro',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function createTray() {
  tray = new Tray(buildTrayIcon());
  tray.setToolTip('Pomodoro - Idle');
  tray.setContextMenu(buildTrayMenu(null));
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });
  tray.on('double-click', showWindow);
}

function updateTray(state) {
  if (!tray) return;
  const tooltip = state?.remainingLabel
    ? `Pomodoro - ${state.phaseLabel}: ${state.remainingLabel}`
    : 'Pomodoro';
  tray.setToolTip(tooltip);
  tray.setContextMenu(buildTrayMenu(state));
}

function showNativeNotification({ title, body }) {
  if (!Notification.isSupported()) return;
  const notif = new Notification({
    title: title || 'Pomodoro',
    body: body || '',
    silent: false
  });
  notif.on('click', showWindow);
  notif.show();
}

// ---------- IPC ----------
ipcMain.handle('config:get', () => loadConfig());
ipcMain.handle('config:set', (_evt, partial) => saveConfig(partial));

ipcMain.handle('window:set-always-on-top', (_evt, value) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(!!value);
    saveConfig({ alwaysOnTop: !!value });
  }
  return !!value;
});

ipcMain.handle('window:minimize-to-tray', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('tray:update', (_evt, state) => updateTray(state));
ipcMain.on('notify', (_evt, payload) => showNativeNotification(payload || {}));

// ---------- App lifecycle ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(() => {
    createMainWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
      else showWindow();
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', (e) => {
    // Keep alive in tray. Only quit if explicitly requested.
    if (!isQuitting) e.preventDefault?.();
  });
}
