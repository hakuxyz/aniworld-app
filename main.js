const { app, BrowserWindow, session, globalShortcut } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const windowStateKeeper = require('electron-window-state');
const DiscordRPC = require('discord-rpc');

const log = {
  info: (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  loader: (step, total, msg) => console.log(`\x1b[36m[LAUNCHER ${step}/${total}]\x1b[0m \x1b[5m...\x1b[0m ${msg}`)
};

let mainWindow;
const clientId = '1256942318465454152'; 
let rpcConnected = false;

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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
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

  mainWindow.webContents.on('did-finish-load', () => {
    log.success('AniWorld execution complete. App fully running.');
    updateDiscordPresence(mainWindow.getTitle());
  });

  mainWindow.on('page-title-updated', (event, title) => {
    updateDiscordPresence(title);
  });

  mainWindow.on('focus', () => {
    globalShortcut.register('Alt+Left', () => {
      if (mainWindow && mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
        log.info('Shortcut trigger: Navigated back');
      }
    });
    globalShortcut.register('Alt+Right', () => {
      if (mainWindow && mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
        log.info('Shortcut trigger: Navigated forward');
      }
    });
  });

  mainWindow.on('blur', () => {
    globalShortcut.unregisterAll();
  });

  mainWindow.on('closed', () => {
    log.info('Closing session.');
    globalShortcut.unregisterAll();
    mainWindow = null;
  });
}

// HIER IST DAS ERWEITERTE LOGGING FÜR DEN DISCORD HANDSHAKE
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
  log.loader(1, 5, 'Booting Electron Core framework');
  
  log.loader(2, 5, 'Connecting to local Discord IPC gateway');
  rpc.login({ clientId }).catch((err) => {
    log.warn(`Discord link skipped: Runtime running in standalone mode. Reason: ${err.message}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  log.info('Runtime environment terminated.');
  try { rpc.destroy(); } catch(e) {}
  if (process.platform !== 'darwin') app.quit();
});