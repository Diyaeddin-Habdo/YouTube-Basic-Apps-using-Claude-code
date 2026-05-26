const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('harmonix', {
  pickFiles: () => ipcRenderer.invoke('pick-files'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  importPaths: (paths) => ipcRenderer.invoke('import-paths', paths),
  loadSession: () => ipcRenderer.invoke('load-session'),
  saveSession: (payload) => ipcRenderer.send('save-session', payload),
  nowPlaying: (state) => ipcRenderer.send('now-playing', state),
  windowAction: (action) => ipcRenderer.send('window-action', action),
  onMediaControl: (handler) => {
    const listener = (_evt, cmd) => handler(cmd);
    ipcRenderer.on('media-control', listener);
    return () => ipcRenderer.removeListener('media-control', listener);
  },
  onTrackUpdate: (handler) => {
    const listener = (_evt, patch) => handler(patch);
    ipcRenderer.on('track-update', listener);
    return () => ipcRenderer.removeListener('track-update', listener);
  },
  // Drag-drop: convert File objects to absolute paths
  getPathForFile: (file) => {
    try { return webUtils.getPathForFile(file); } catch { return file?.path || null; }
  },
});
