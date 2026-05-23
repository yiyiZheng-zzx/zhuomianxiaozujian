const { app, BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let tray = null;
let isQuitting = false;

// Config file for window position
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch(e) { return {}; }
}
function saveConfig(obj) {
  try { fs.writeFileSync(configPath, JSON.stringify(obj)); } catch(e) {}
}

// Prevent multiple instances
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });

function createWindow() {
  const config = loadConfig();
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 540,
    height: 420,
    x: typeof config.x === 'number' ? config.x : sw - 560,
    y: typeof config.y === 'number' ? config.y : 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minWidth: 400,
    minHeight: 360,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');

  // Save position on move
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    saveConfig({ x, y });
  });

  // Hide to tray instead of closing
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  try {
    // Simple green dot icon
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVQ4y2NkYPj/n2EUjIJRMApGAQAABQABg0RJGAAAAABJRU5ErkJggg==',
      'base64'
    );
    tray = new Tray(nativeImage.createFromBuffer(png, { width: 16, height: 16 }));
    tray.setToolTip('什么时候休息');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '显示/隐藏', click: () => win.isVisible() ? win.hide() : win.show() },
      { type: 'separator' },
      { label: '开机自启', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
      { type: 'separator' },
      { label: '退出', click: () => { isQuitting = true; app.quit(); } },
    ]));
    tray.on('double-click', () => win.isVisible() ? win.hide() : win.show());
  } catch(e) {}
}

// IPC
ipcMain.on('minimize', () => win?.minimize());
ipcMain.on('hide', () => win?.hide());

// Fix Windows sandbox issues
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

app.whenReady().then(() => {
  createWindow();
  createTray();
});
app.on('window-all-closed', () => {});
app.on('activate', () => win ? win.show() : createWindow());
