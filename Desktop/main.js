const { app, BrowserWindow, ipcMain, protocol, screen, desktopCapturer } = require('electron');
const path = require('path');
const url = require('url');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { exec } = require('child_process');
const { access } = require('fs/promises');
const TRUCK_ID='2g374g2asdfasdf3g472g42g42grbrer';
const SECRET='HassanDEV';
let mainWindow;
let externalWindow;
let traccarServer;
let traccarPort = 8083;
let mainWindowServer = null;
let serverConnections = new Set();
let syncMessageQueue = [];
let externalWindowReady = false;

// Configure cross-platform GPU settings
if (process.platform === 'darwin') {
  // macOS specific settings
  app.commandLine.appendSwitch('use-gl', 'desktop');
} else if (process.platform === 'linux') {
  // Linux specific settings
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
} else {
  // Windows and other platforms
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
}

// Common GPU settings for all platforms
app.commandLine.appendSwitch('ignore-gpu-blacklist');

// Suppress GPU process logging on all platforms
process.env.ELECTRON_DISABLE_GPU_PROCESS_LOG = 'true';

console.log('Starting app...');
console.time('app.whenReady');
app.whenReady().then(async () => {
  console.timeEnd('app.whenReady');
  protocol.registerFileProtocol('safe-file', (request, callback) => {
    try {
      const filePath = request.url.replace('safe-file://', '');
      const decodedPath = decodeURIComponent(filePath);
      
      // Check if file exists
      if (fs.existsSync(decodedPath)) {
        callback({ path: decodedPath });
      } else {
        callback({ error: 404 });
      }
    } catch (error) {
      callback({ error: 500 });
    }
  });

  await stopExistingTraccarProcess();
  createWindow();
}).catch(error => {
  console.log('Error during app initialization:', error);
});

function createWindow() {
  try {
    // Add GPU debugging options
    const windowOptions = {
      width: 1920,
      height: 1080,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        // Add these to help debug GPU issues
        webgl: true,
        webSecurity: true,
        backgroundThrottling: false
      },
      fullscreen: true,
      autoHideMenuBar: true
    };

    // Log window creation
    console.log('Creating main window with options:', JSON.stringify(windowOptions, null, 2));
    
    mainWindow = new BrowserWindow(windowOptions);

    // Listen for GPU process crashes
    mainWindow.webContents.on('gpu-process-crashed', (event, killed) => {
      console.log('GPU Process Crashed:', {
        killed,
        time: new Date().toISOString()
      });
    });

    // Listen for GPU info updates
    mainWindow.webContents.on('gpu-info-update', () => {
      console.log('GPU Info Updated at:', new Date().toISOString());
    });

    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, 'dist/angular-app/index.html'),
      protocol: 'file:',
      slashes: true
    });
    
    mainWindow.loadURL(startUrl);

    // Add close handler
    mainWindow.on('close', async (e) => {
      e.preventDefault();
      try {
        // First close external window if it exists
        if (externalWindow && !externalWindow.isDestroyed()) {
          await new Promise(resolve => {
            externalWindow.close();
            externalWindow = null;
            resolve();
          });
        }
        
        // Stop Traccar server
        if (traccarServer) {
          await stopTraccarServer();
        }
        
        // Clear all connections
        serverConnections.clear();
        
        // Now close main window
        mainWindow.destroy();
      } catch (error) {
        console.log('Error during window close:', error);
        mainWindow.destroy();
      }
    });

  } catch (error) {
    console.log("error in main.js createWindow",error);
  }
}

function createExternalWindow(displayConfig) {
  try {
    console.log('main.js createExternalWindow with config:', displayConfig);

    // Use physical resolution from display config if available
    const width = displayConfig?.physicalResolution?.width || 1920;
    const height = displayConfig?.physicalResolution?.height || 1080;

    externalWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false,
        backgroundThrottling: false
      },
      fullscreen: true,
      autoHideMenuBar: true,
      frame: false,
      backgroundColor: '#000000'
    });

    const startUrl = `${process.env.ELECTRON_START_URL}/#/external-display`;
    const fallbackUrl = url.format({
      pathname: path.join(__dirname, 'dist/angular-app/index.html'),
      protocol: 'file:',
      slashes: true,
      hash: '/external-display'
    });

    const finalUrl = process.env.ELECTRON_START_URL ? startUrl : fallbackUrl;

    externalWindow.loadURL(finalUrl);

    externalWindow.webContents.on('did-finish-load', () => {
      externalWindowReady = true;
      // Process any queued messages
      while (syncMessageQueue.length > 0) {
        const message = syncMessageQueue.shift();
        externalWindow.webContents.send('sync-update', message);
      }
    });

    return true;
  } catch (error) {
    console.log("error in main.js createExternalWindow", error);
    return false;
  }
}

app.on("window-all-closed", async () => {
  try {
    // Stop Traccar server if running
    if (traccarServer) {
      await stopTraccarServer();
    }
    
    // Clean up external window reference
    if (externalWindow) {
      externalWindow = null;
    }
    
    // Clear all connections and intervals
    clearInterval(checkConnectionStatus);
    serverConnections.clear();
    
    // Quit app regardless of platform
    app.quit();
  } catch (error) {
    console.log('main.js window-all-closed Error during cleanup:', error);
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null && externalWindow === null) {
    createWindow();
  }
});

function getServerIp() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

ipcMain.handle('get-server-ip', () => {
  return getServerIp();
});

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        resolve(false);
      })
      .once('listening', () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      })
      .listen(port);
  });
}

function stopExistingTraccarProcess() {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      exec(`taskkill /F /IM traccar.exe`, (error) => {
          if (error) {
            console.log('main.js stopExistingTraccarProcess No existing Traccar process found or unable to kill');
        }
        resolve();
      });
    } else {
      exec(`pkill -f traccar`, (error) => {
        if (error) {
          console.log('main.js stopExistingTraccarProcess No existing Traccar process found or unable to kill');
        }
        resolve();
      });
    }
  });
}

function createTraccarServer() {
  return new Promise((resolve, reject) => {
    
    const server = net.createServer((socket) => {
      serverConnections.add(socket);

      socket.on('data', (data) => {
        try {
          processData(data.toString());
          socket.write('HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n');
        } catch (error) {
          console.log('main.js createTraccarServer Error processing data:', error);
        }
      });

      socket.on('end', () => {
        serverConnections.delete(socket);
      });

      socket.on('error', (error) => {
        console.log('main.js createTraccarServer Socket error:', error);
        serverConnections.delete(socket);
      });
    });

    server.listen(traccarPort, () => {
      mainWindowServer = server;
      resolve(server);
    });

    server.on('error', (error) => {
      console.log('main.js createTraccarServer Server error:', error);
      reject(error);
    });
  });
}

async function startTraccarServer() {
  
  if (mainWindowServer) {
    return mainWindowServer;
  }

  try {
    const server = await createTraccarServer();
    mainWindowServer = server;
    return server;
  } catch (error) {
    console.log('main.js startTraccarServer Failed to create server:', error);
    throw error;
  }
}

async function stopTraccarServer() {
  if (mainWindowServer) {
    
    // Close all active connections
    for (const socket of serverConnections) {
      socket.destroy();
    }
    serverConnections.clear();

    return new Promise((resolve) => {
      mainWindowServer.close(() => {
        mainWindowServer = null;
        resolve();
      });
    });
  }
  return Promise.resolve();
}

function processData(rawData) {
  const lines = rawData.split('\n');
  lines.forEach(line => {
    if (line.startsWith('POST')) {
      const parsedUrl = url.parse(line, true);
      const query = parsedUrl.query;

      if (query.lat && query.lon) {
        const timestamp = new Date().toISOString();
        const locationUpdate = {
          timestamp,
          latitude: parseFloat(query.lat),
          longitude: parseFloat(query.lon),
          speed: query.speed ? parseFloat(query.speed) : null,
          bearing: query.bearing ? parseFloat(query.bearing) : null,
          accuracy: query.accuracy ? parseFloat(query.accuracy) : null,
        };
        mainWindow.webContents.send('location-update', locationUpdate);
      }
    }
  });
}

ipcMain.handle('connect-traccar', async (event) => {
  try {
    // Check if this is the external window
    if (event.sender === externalWindow?.webContents) {
      return { 
        success: true, 
        port: traccarPort,
        isExternal: true 
      };
    }

    // For main window, start or reuse server
    await startTraccarServer();
    
    mainWindow.webContents.send('connection-status-change', true);
    return { 
      success: true, 
      port: traccarPort,
      isExternal: false
    };
  } catch (error) {
    console.log('main.js connect-traccar Connection error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('disconnect-traccar', async () => {
  try {
    await stopTraccarServer();
    mainWindow.webContents.send('connection-status-change', false);
    return { success: true };
  } catch (error) {
    console.log('main.js disconnect-traccar Failed to stop Traccar server:', error);
    return { success: false, error: error.message };
  }
});

async function downloadFile(id, url, mediaType) {
  const destination = path.join(app.getPath('downloads'), 'showyouradzvideos');
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  const fileExtension = mediaType.toLowerCase() === 'video' ? '.mp4' : '.jpg';
  const fileName = `${id}${fileExtension}`;
  const fullDestination = path.join(destination, fileName);
  const writer = fs.createWriteStream(fullDestination);
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;
    response.data.on('data', (chunk) => {
      downloadedLength += chunk.length;
      const progress = (downloadedLength / totalLength) * 100;
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', { id, progress: progress.toFixed(2) });
      }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(fullDestination));
      writer.on('error', reject);
    });
  } catch (error) {
    writer.close();
    fs.unlink(fullDestination, () => {});
    throw error;
  }
}

ipcMain.handle('download-file', async (event, id, fileUrl, mediaType) => {
  try {
    const path = await downloadFile(id, fileUrl, mediaType);
    return { success: true, path };
  } catch (error) {
    console.log('main.js download-file Download failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-downloads-path', (event, fileName) => {
  const downloadsPath = app.getPath('downloads');
  return path.join(downloadsPath, fileName);
});

function checkConnectionStatus() {
  if (mainWindow && traccarServer) {
    mainWindow.webContents.send('connection-status-change', true);
  } else if (mainWindow) {
    mainWindow.webContents.send('connection-status-change', false);
  }
}

// Call this function every 2 seconds
setInterval(checkConnectionStatus, 2000);

ipcMain.handle('get-local-video-url', (event, filePath) => {
  return `safe-file://${filePath}`;
});

// Existing event listeners...

// Add the following IPC handler for 'get-campaigns'
ipcMain.handle('get-campaigns', async (event) => {
  try {
    // Prepare data as a string
    const data = JSON.stringify({
      secret: SECRET,
      truckId: TRUCK_ID
    });

    // Configure the request to match the working example
    const config = {
      headers: {
        'Content-Type': 'text/plain',
        'Cookie': 'XSRF-TOKEN=1728851289|_lgUYz4x2Lyh'
      },
      timeout: 5000 // Optional: Set a timeout for the request
    };

    // Make the POST request
    const response = await axios.post(
      'https://www.showyouradz.com/_functions/userscampaigns',
      data,
      config
    );
    // Return the response data
    return response.data ;
  } catch (error) {
    throw error;
  }

});

ipcMain.handle('update-campaign', async (event, campaignId, downloadPath) => {
  try {
    // Prepare data as a string
    const data = JSON.stringify({
      secret: SECRET,
      truckId: TRUCK_ID,
      id: campaignId,
      downloadPath: downloadPath,
    });

    // Configure the request to match the working example
    const config = {
      headers: {
        'Content-Type': 'text/plain',
        'Cookie': 'XSRF-TOKEN=1728851289|_lgUYz4x2Lyh'
      },
      timeout: 5000 // Optional: Set a timeout for the request
    };

    // Make the POST request
    const response = await axios.post(
      'https://www.showyouradz.com/_functions/updateCustomerCampaigns',
      data,
      config
    );
    return response.data ;
  } catch (error) {
    throw error;
  }
});
// Rest of your main.js code...

ipcMain.on('close-window', async () => {
  try {
    if (mainWindow) {
      mainWindow.close(); // This will trigger our close handler
    }
  } catch (error) {
    console.log('main.js close-window Error closing windows:', error);
    if (mainWindow) {
      mainWindow.destroy();
    }
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Add this handler
ipcMain.handle('check-file-exists', async (event, filePath) => {
    try {
        // Ensure we're using absolute path
        const absolutePath = path.resolve(filePath);
        
        const exists = await fs.promises.access(absolutePath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);
        return exists;
    } catch (error) {
        console.log('main.js check-file-exists Error checking file existence:', error);
        return false;
    }
});

// Add new IPC handlers for window management
ipcMain.handle('get-window-type', (event) => {
  if (event.sender === mainWindow?.webContents) {
    return 'main';
  } else if (event.sender === externalWindow?.webContents) {
    return 'external';
  }
  return 'unknown';
});


// Add new IPC handlers
ipcMain.handle('create-external-window', (event, displayConfig) => {
  console.log('main.js create-external-window handler with config:', displayConfig);
  return createExternalWindow(displayConfig);
});

ipcMain.handle('close-external-window', async () => {
  try {
    if (externalWindow && !externalWindow.isDestroyed()) {
      externalWindow.close();
      externalWindow = null;
      return true;
    }
    return false;
  } catch (error) {
    console.log('main.js close-external-window Error:', error);
    return false;
  }
});

// Modify the sync handler
ipcMain.on('sync-video-action', (event, action) => {
  console.log('main.js sync-video-action Received action:', action);
  
  if (!externalWindow || externalWindow.isDestroyed()) {
    console.log('main.js sync-video-action ERROR: External window not available');
    return;
  }

  try {
    const syncMessage = {
      ...action,
      timestamp: Date.now(),
    };

    if (!externalWindowReady && action.type === 'loadVideo') {
      syncMessageQueue.push(syncMessage);
      console.log('main.js sync-video-action Queued loadVideo action');
      return;
    }

    console.log(`main.js sync-video-action Sending action: ${JSON.stringify(syncMessage)}`);
    externalWindow.webContents.send('sync-update', syncMessage);
  } catch (error) {
    console.log(`main.js sync-video-action ERROR: Failed to send action: ${error.message}`);
  }
});

// Add this before creating external window
async function setupExternalWindow() {
  try {
    
    // Check port before window creation
    const portAvailable = await isPortAvailable(8083);
    
    if (!portAvailable) {
      console.log('main.js setupExternalWindow WARNING: Port 8083 is in use');
    }

    return createExternalWindow();
  } catch (error) {
    console.log('main.js setupExternalWindow Setup error:', {
      message: error.message
    });
    return false;
  }
}

app.on('before-quit', async (event) => {
  try {
    event.preventDefault();
    
    // Stop Traccar server
    if (traccarServer) {
      await stopTraccarServer();
    }
    
    // Clear all connections and intervals
    clearInterval(checkConnectionStatus);
    serverConnections.clear();
    
    // Clean up windows
    if (externalWindow && !externalWindow.isDestroyed()) {
      externalWindow.destroy();
      externalWindow = null;
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
    
    app.quit();
  } catch (error) {
    console.log('Error during app quit:', error);
    app.quit();
  }
});

ipcMain.handle('access-file', async (event, path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
});

// Add this new IPC handler for getting displays
ipcMain.handle('get-displays', () => {
  try {
    const displays = screen.getAllDisplays();
    return displays.map((display, index) => ({
      id: index,
      name: `Screen ${index + 1}`,
      ...display,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      touchSupport: display.touchSupport
    }));
  } catch (error) {
    console.log('main.js get-displays Error:', error);
    return [];
  }
});

// Add this new IPC handler for getting screen thumbnails
ipcMain.handle('get-screen-thumbnail', async (event, sourceId) => {
  try {
    console.log('main.js get-screen-thumbnail Requested sourceId:', sourceId);
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 320, height: 180 }  // 16:9 ratio thumbnail
    });
    
    console.log('main.js get-screen-thumbnail Available sources:', sources.map(s => ({
      id: s.id,
      name: s.name,
      display_id: s.display_id
    })));

    // Try to find the source by display_id first
    let source = sources.find(s => s.display_id === sourceId.toString());
    
    if (!source) {
      // If not found by display_id, try to find by index in the format "screen:X:0"
      const screenIndex = parseInt(sourceId);
      if (!isNaN(screenIndex)) {
        source = sources.find(s => s.id === `screen:${screenIndex}:0`);
      }
    }

    if (!source) {
      console.log('main.js get-screen-thumbnail No matching source found for:', sourceId);
      return null;
    }
    
    const dataUrl = source.thumbnail.toDataURL();
    console.log('main.js get-screen-thumbnail Successfully generated thumbnail for screen:', source.name);
    return dataUrl;
  } catch (error) {
    console.log('main.js get-screen-thumbnail Error:', error);
    return null;
  }
});
