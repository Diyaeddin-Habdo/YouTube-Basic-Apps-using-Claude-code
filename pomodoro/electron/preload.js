const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoroAPI', {
  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (partial) => ipcRenderer.invoke('config:set', partial),

  // Window
  setAlwaysOnTop: (value) => ipcRenderer.invoke('window:set-always-on-top', value),
  minimizeToTray: () => ipcRenderer.invoke('window:minimize-to-tray'),

  // Tray sync (renderer -> main)
  updateTray: (state) => ipcRenderer.send('tray:update', state),

  // Notifications (renderer -> main)
  notify: (payload) => ipcRenderer.send('notify', payload),

  // Tray commands (main -> renderer)
  onTrayCommand: (handler) => {
    const listener = (_evt, command) => handler(command);
    ipcRenderer.on('tray:command', listener);
    return () => ipcRenderer.removeListener('tray:command', listener);
  }
});
