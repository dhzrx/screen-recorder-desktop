import { app, BrowserWindow, ipcMain, desktopCapturer, screen } from 'electron'
import path from 'node:path'

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
let floatingWin: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST!, 'index.html'))
    }
}

function createFloatingWindow() {
    floatingWin = new BrowserWindow({
        width: 300,
        height: 60,
        type: 'toolbar',
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    if (VITE_DEV_SERVER_URL) {
        floatingWin.loadURL(VITE_DEV_SERVER_URL + '#floating')
    } else {
        floatingWin.loadFile(path.join(process.env.DIST!, 'index.html'), { hash: 'floating' })
    }

    // Initially hidden, shown when recording starts
    floatingWin.hide();
}

// IPC Handlers for Floating Window
ipcMain.on('SHOW_FLOATING_CONTROLS', () => {
    if (!floatingWin || floatingWin.isDestroyed()) {
        createFloatingWindow();
    }
    floatingWin?.show();
    // Optional: Minimize main window?
    // win?.minimize();
})

ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async (_event, opts) => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    return sources;
})

ipcMain.handle('GET_SCREEN_BOUNDS', async (_event, sourceId: string, displayId?: string) => {
    const displays = screen.getAllDisplays();
    console.log('[Main] GET_SCREEN_BOUNDS request. SourceID:', sourceId, 'DisplayID:', displayId);

    // 1. Try matching by displayId if provided
    if (displayId) {
        const id = parseInt(displayId, 10);
        const display = displays.find(d => d.id === id);
        if (display) {
            console.log('[Main] Found Display by displayId:', display.bounds);
            return display.bounds;
        }
    }

    // 2. Try parsing sourceId (Legacy/Fallback)
    const parts = sourceId.split(':');
    if (parts[0] === 'screen') {
        const id = parseInt(parts[1], 10);
        const display = displays.find(d => d.id === id);
        if (display) {
            console.log('[Main] Found Display by sourceId parse:', display.bounds);
            return display.bounds;
        }
    }

    // 3. Fallback: return primary display bounds
    console.log('[Main] Fallback to Primary Display');
    return screen.getPrimaryDisplay().bounds;
})
ipcMain.on('HIDE_FLOATING_CONTROLS', () => {
    floatingWin?.hide();
    win?.show();
})

// Cursor Polling Loop
app.whenReady().then(() => {
    createWindow()
    createFloatingWindow()

    // Cursor Polling Loop - Start only after app is ready
    setInterval(() => {
        const point = screen.getCursorScreenPoint()

        if (win && !win.isDestroyed()) {
            win.webContents.send('cursor-position', point)
        }

        // Also send to floating window if needed
        if (floatingWin && !floatingWin.isDestroyed() && floatingWin.isVisible()) {
            floatingWin.webContents.send('cursor-position', point)
        }
    }, 16) // ~60fps
})
