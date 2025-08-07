const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  downloadFile: (id, url, mediaType) => ipcRenderer.invoke('download-file', id, url, mediaType),
  getDownloadsPath: (fileName) => ipcRenderer.invoke('get-downloads-path', fileName),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
    return () => {
      ipcRenderer.removeAllListeners('download-progress');
    };
  },
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  getScreenThumbnail: (sourceId) => ipcRenderer.invoke('get-screen-thumbnail', sourceId),
  connectTraccar: () => ipcRenderer.invoke('connect-traccar'),
  disconnectTraccar: () => ipcRenderer.invoke('disconnect-traccar'),
  onLocationUpdate: (callback) => {
    console.log('preload.js: Setting up location update listener');
    ipcRenderer.on('location-update', (event, update) => {
      console.log('preload.js: Received location update:', update);
      callback(update);
    });
    return () => {
      console.log('preload.js: Cleaning up location update listener');
      ipcRenderer.removeAllListeners('location-update');
    };
  },
  getServerIp: () => ipcRenderer.invoke('get-server-ip'),
  onConnectionStatusChange: (callback) => {
    ipcRenderer.on('connection-status-change', (event, status) => callback(status));
    return () => {
      ipcRenderer.removeAllListeners('connection-status-change');
    };
  },
  getLocalVideoUrl: (filePath) => ipcRenderer.invoke('get-local-video-url', filePath),

  // Add the following method to expose 'get-campaigns'
  getCampaigns: () => ipcRenderer.invoke('get-campaigns'),
  updateCampaign: (campaignId, downloadPath) => ipcRenderer.invoke('update-campaign', campaignId, downloadPath),

  closeWindow: async () => {
    // First close external window
    await ipcRenderer.invoke('close-external-window');
    // Then close main window
    ipcRenderer.send('close-window');
  },
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  logToMain: (message) => ipcRenderer.send('log-message', message),
  getWindowType: () => ipcRenderer.invoke('get-window-type'),

  onMainProcessLog: (callback) => {
    ipcRenderer.on('main-process-log', (event, log) => {
      callback(log);
    });
    return () => {
      ipcRenderer.removeAllListeners('main-process-log');
    };
  },

  createExternalWindow: (displayConfig) => {
    console.log("preload.js createExternalWindow with config:", displayConfig);
    return ipcRenderer.invoke('create-external-window', displayConfig);
  },
  closeExternalWindow: () => ipcRenderer.invoke('close-external-window'),

  syncVideoAction: (action) => {
    console.log("preload.js syncVideoAction", action);
    ipcRenderer.send('sync-video-action', action);
  },
  onSyncUpdate: (callback) => {
    console.log("preload.js onSyncUpdate started", callback);
    ipcRenderer.on('sync-update', (event, update) => {
      console.log("preload.js onSyncUpdate", update);
      callback(update);
    });
    return () => {
      ipcRenderer.removeAllListeners('sync-update');
    };
  },
  accessFile: (path) => ipcRenderer.invoke('access-file', path),
});
