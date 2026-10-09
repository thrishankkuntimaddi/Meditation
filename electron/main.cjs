/**
 * Meditation — desktop shell (Electron).
 *
 * Serves the bundled web app from dist-native over a private `app://` scheme
 * (secure context, so IndexedDB / Firestore offline cache / Web Audio all work),
 * and exposes a tiny focus API to the page through preload.cjs:
 *   - keep the display awake during a session
 *   - mute system audio while another device meditates (macOS)
 *   - run the user's "Meditation Focus On/Off" Shortcuts to toggle macOS Focus
 */
const { app, BrowserWindow, ipcMain, powerSaveBlocker, protocol, net, shell, nativeTheme } = require('electron');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DIST = path.join(__dirname, '..', 'dist-native');
const isMac = process.platform === 'darwin';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 900,
    minWidth: 360,
    minHeight: 640,
    title: 'Meditation',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141211' : '#FAFAF9',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false, // keep session timers & bells exact when minimised
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://meditation/index.html');

  // External links (download page, password reset) open in the browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) { e.preventDefault(); shell.openExternal(url); }
  });
}

// ── Focus helpers ──────────────────────────────────────────────────────────────

const run = (cmd, args) => new Promise(resolve => {
  execFile(cmd, args, { timeout: 8000 }, (err, stdout) => resolve(err ? null : String(stdout).trim()));
});

let blockerId = null;
ipcMain.handle('focus:keepAwake', (_e, on) => {
  if (on && blockerId === null) blockerId = powerSaveBlocker.start('prevent-display-sleep');
  if (!on && blockerId !== null) { powerSaveBlocker.stop(blockerId); blockerId = null; }
});

// Only un-mute if *we* muted, so we never fight the user's own setting
let weMuted = false;
ipcMain.handle('focus:setSystemMuted', async (_e, muted) => {
  if (!isMac) return false;
  if (muted) {
    const already = await run('osascript', ['-e', 'output muted of (get volume settings)']);
    if (already === 'true') return true;
    const ok = (await run('osascript', ['-e', 'set volume with output muted'])) !== null;
    weMuted = ok;
    return ok;
  }
  if (!weMuted) return true;
  weMuted = false;
  return (await run('osascript', ['-e', 'set volume without output muted'])) !== null;
});

// macOS has no public API to toggle Focus; Shortcuts can. Users who create
// "Meditation Focus On" / "Meditation Focus Off" shortcuts get system DND.
let shortcutCache = null;
ipcMain.handle('focus:setFocusShortcut', async (_e, on) => {
  if (!isMac) return false;
  if (shortcutCache === null) {
    const list = await run('shortcuts', ['list']);
    shortcutCache = list ? list.split('\n').map(s => s.trim()) : [];
  }
  const name = on ? 'Meditation Focus On' : 'Meditation Focus Off';
  if (!shortcutCache.includes(name)) return false;
  return (await run('shortcuts', ['run', name])) !== null;
});

ipcMain.handle('app:version', () => app.getVersion());

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  protocol.handle('app', req => {
    const { pathname } = new URL(req.url);
    const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.on('before-quit', async () => {
  if (blockerId !== null) powerSaveBlocker.stop(blockerId);
  if (weMuted) await run('osascript', ['-e', 'set volume without output muted']);
});

app.on('window-all-closed', () => { if (!isMac) app.quit(); });
