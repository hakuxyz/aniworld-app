const { app, BrowserWindow, session, ipcMain } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const windowStateKeeper = require('electron-window-state');
const DiscordRPC = require('discord-rpc');
const MprisService = require('mpris-service');
const fs = require('fs');
const path = require('path');

// Hardware-Beschleunigung für Linux
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

const storagePath = path.join(app.getPath('userData'), 'session-resume.json');

// MPRIS Setup für System-Mediensteuerung
const mpris = new MprisService({
  name: 'aniworld',
  identity: 'AniWorld Client',
  supportedInterfaces: ['player']
});

mpris.on('playpause', () => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript("document.querySelector('video')?.paused ? document.querySelector('video')?.play() : document.querySelector('video')?.pause()");
  }
});

function saveSession(url, title) {
  try {
    let data = loadStorage();
    if (data.dontShowAgain) return;
    
    if (url.includes('/anime/stream/') || url.includes('/stream/')) {
      data.lastUrl = url;
      data.lastTitle = title.replace(' | AniWorld.to', '').replace('AniWorld.to', '').trim();
      fs.writeFileSync(storagePath, JSON.stringify(data));
    }
  } catch (e) {}
}

function loadStorage() {
  try {
    if (fs.existsSync(storagePath)) {
      return JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    }
  } catch (e) {}
  return { lastUrl: null, lastTitle: null, dontShowAgain: false };
}

const log = {
  send: (type, color, msg) => {
    console.log(`${color}[${type}]\x1b[0m ${msg}`);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('log-to-console', type, color, msg);
    }
  },
  info: (msg) => log.send('INFO', '\x1b[34m', msg),
  success: (msg) => log.send('SUCCESS', '\x1b[32m', msg),
  warn: (msg) => log.send('WARN', '\x1b[33m', msg),
  error: (msg) => log.send('ERROR', '\x1b[31m', msg),
  loader: (step, total, msg) => log.send(`LAUNCHER ${step}/${total}`, '\x1b[36m', msg)
};

let mainWindow;
let splashWindow;
let isInitialLoad = true;
const clientId = '1256942318465454152'; 
let rpcConnected = false;
let isPiPMode = false;
let prePiPBounds = {};

DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

function updateDiscordPresence(title) {
  if (!rpcConnected) return;

  let details = 'Browsing Anime';
  let state = 'Main Menu';

  if (title && title.includes('-')) {
    const parts = title.split('-');
    details = parts[0].trim();
    state = parts.slice(1).join('-').trim();
  } else if (title && title.trim() !== '' && !title.toLowerCase().includes('aniworld')) {
    details = title.trim();
  }

  if (details.toLowerCase() === 'aniworld' || details.toLowerCase() === 'aniworld.to') {
    details = 'Browsing Anime';
    state = 'Looking for something to watch';
  }

  log.info(`Syncing Discord RPC: ${details} | ${state}`);

  rpc.setActivity({
    details: details,
    state: state,
    instance: false
  }).catch((err) => log.warn(`RPC Activity error: ${err.message}`));
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 650,
    height: 400,
    frame: false, 
    alwaysOnTop: true,
    resizable: false,
    center: true,
    backgroundColor: '#0a0a0c',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const splashHTML = `
    html, body {
      background: #0a0a0c;
      color: #d1d5db;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      margin: 0;
      padding: 15px;
      height: 100vh;
      box-sizing: border-box;
      overflow: hidden;
    }
    #console {
      height: 100%;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .line { margin-bottom: 4px; }
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head><style>${splashHTML}</style></head>
    <body>
      <div id="console"></div>
      <script>
        const { ipcRenderer } = require('electron');
        const consoleDiv = document.getElementById('console');
        
        function ansiToHtml(color, type, msg) {
          let htmlColor = '#ffffff';
          if (color.includes('[34m')) htmlColor = '#3b82f6';
          if (color.includes('[32m')) htmlColor = '#10b981';
          if (color.includes('[33m')) htmlColor = '#f59e0b';
          if (color.includes('[31m')) htmlColor = '#ef4444';
          if (color.includes('[36m')) htmlColor = '#06b6d4';
          return '<div class="line"><span style="color:' + htmlColor + '; font-weight:bold;">[' + type + ']</span> ' + msg + '</div>';
        }

        ipcRenderer.on('log-to-console', (event, type, color, msg) => {
          consoleDiv.innerHTML += ansiToHtml(color, type, msg);
          consoleDiv.scrollTop = consoleDiv.scrollHeight;
        });
      </script>
    </body>
    </html>
  `)}`);
}

async function createWindow() {
  log.loader(3, 5, 'Setting up window dimensions and state memory');
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 720
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: "AniWorld",
    autoHideMenuBar: true,
    show: false, 
    frame: false, 
    backgroundColor: '#0a0a0c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindowState.manage(mainWindow);
  app.commandLine.appendSwitch('lang', 'en-US');

  log.loader(4, 5, 'Compiling advanced uBlock security filters');
  try {
    const blocker = await ElectronBlocker.fromLists(fetch, [
      'https://easylist.to/easylist/easylist.txt',
      'https://easylist.to/easylist/easyprivacy.txt',
      'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
      'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
      'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
      'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt'
    ]);
    blocker.enableBlockingInSession(session.defaultSession);
    log.success('Adblocker engine successfully running');
  } catch (err) {
    log.error(`Failed to inject engine: ${err.message}`);
  }

  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      log.warn(`Blocked redirect engine threat targeting: ${url}`);
      return { action: 'deny' };
    });
    contents.on('will-navigate', (navEvent, url) => {
      const allowedDomains = ['aniworld.to', 's.to', 'voe.sx', 'streamtape.com', 'vidoza.net', 'dood', 'duden', 'embed'];
      const isAllowed = allowedDomains.some(domain => url.includes(domain));
      if (!isAllowed) {
        navEvent.preventDefault();
        log.warn(`Iframe escape vector terminated: ${url}`);
      }
    });
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  log.loader(5, 5, 'Establishing handshake with https://aniworld.to');
  mainWindow.loadURL('https://aniworld.to');

  mainWindow.webContents.on('page-title-updated', (event, title) => {
    updateDiscordPresence(title);
    saveSession(mainWindow.webContents.getURL(), title);
    
    // Sync Navigation Button Status an das Preload Script
    if (mainWindow) {
      mainWindow.webContents.send('nav-state-sync', {
        canGoBack: mainWindow.webContents.canGoBack(),
        canGoForward: mainWindow.webContents.canGoForward()
      });
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log.success('AniWorld execution complete. App fully running.');
    
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();

      if (isInitialLoad) {
        const sessionData = loadStorage();
        if (sessionData.lastUrl && !sessionData.dontShowAgain) {
          mainWindow.webContents.send('show-resume-overlay', sessionData.lastTitle, sessionData.lastUrl);
        }
        isInitialLoad = false;
      }
    }, 300);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (input.alt && input.key.toLowerCase() === 'arrowleft') {
      if (mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
        log.info('Shortcut trigger: Navigated back');
      }
    }
    if (input.alt && input.key.toLowerCase() === 'arrowright') {
      if (mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
        log.info('Shortcut trigger: Navigated forward');
      }
    }
    if (input.key.toLowerCase() === 'f11') {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
      log.info(`Window status: Fullscreen toggled to ${!isFullScreen}`);
    }
    if (input.alt && input.key.toLowerCase() === 'p') {
      isPiPMode = !isPiPMode;
      if (isPiPMode) {
        prePiPBounds = mainWindow.getBounds();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setSize(410, 260);
        log.info('PiP Mode activated (Always on Top)');
      } else {
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setBounds(prePiPBounds);
        log.info('PiP Mode deactivated');
      }
    }
  });

  mainWindow.on('closed', () => {
    log.info('Closing session.');
    mainWindow = null;
  });
}

// IPC Kanäle für Rahmensteuerung und Navigation
ipcMain.on('window-close-trigger', () => {
  if (mainWindow) mainWindow.close(); 
});

ipcMain.on('nav-back-trigger', () => {
  if (mainWindow && mainWindow.webContents.canGoBack()) mainWindow.webContents.goBack();
});

ipcMain.on('nav-forward-trigger', () => {
  if (mainWindow && mainWindow.webContents.canGoForward()) mainWindow.webContents.goForward();
});

ipcMain.on('resume-action', (event, action, url, dontShowAgain) => {
  let data = loadStorage();
  data.dontShowAgain = dontShowAgain;
  
  if (dontShowAgain || action === 'no') {
    data.lastUrl = null;
    data.lastTitle = null;
  }
  fs.writeFileSync(storagePath, JSON.stringify(data));

  if (action === 'yes' && url) {
    log.info(`Resuming last tracked session: ${url}`);
    mainWindow.loadURL(url);
  }
});

rpc.on('ready', () => {
  const userTag = rpc.user ? `${rpc.user.username}#${rpc.user.discriminator || '0000'}` : 'Unknown User';
  const userId = rpc.user ? rpc.user.id : 'Unknown ID';
  
  log.success(`Discord Core IPC channel linked successfully!`);
  log.info(`Connected to Client ID : \x1b[35m${clientId}\x1b[0m`);
  log.info(`Logged in as Discord User: \x1b[32m${userTag}\x1b[0m (ID: ${userId})`);
  
  rpcConnected = true;
  if (mainWindow) updateDiscordPresence(mainWindow.getTitle());
});

app.whenReady().then(() => {
  console.log('\x1b[35m' + `
========================================
   ANIWORLD LINUX RUNTIME ENVIRONMENT   
========================================` + '\x1b[0m');
  
  createSplashWindow();

  setTimeout(() => {
    log.loader(1, 5, 'Booting Electron Core framework');
    log.loader(2, 5, 'Connecting to local Discord IPC gateway');
    rpc.login({ clientId }).catch((err) => {
      log.warn(`Discord link skipped: Runtime running in standalone mode. Reason: ${err.message}`);
    });

    createWindow();
  }, 150);
});

app.on('window-all-closed', () => {
  log.info('Runtime environment terminated.');
  try { rpc.destroy(); } catch(e) {}
  if (process.platform !== 'darwin') app.quit();
});