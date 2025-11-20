import { app, BrowserWindow, ipcMain, desktopCapturer, screen } from 'electron'
import path from 'node:path'

// Handle screen sources request
ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async () => {
    return desktopCapturer.getSources({ types: ['window', 'screen'] })
})

ipcMain.handle('GET_SCREEN_BOUNDS', async (_event, sourceId: string) => {
    const displays = screen.getAllDisplays();
    // sourceId from desktopCapturer is usually "screen:0:0" or similar.
    // The display_id in desktopCapturer matches display.id (but as string).

    // We need to parse the sourceId or find a way to match.
    // desktopCapturer source.id for screens is usually "screen:display_id"

    const parts = sourceId.split(':');
    if (parts[0] === 'screen') {
        const displayId = parseInt(parts[1], 10);
        const display = displays.find(d => d.id === displayId);
        if (display) {
            return display.bounds;
        }
    }

    // Fallback: return primary display bounds
    return screen.getPrimaryDisplay().bounds;
})

// Handle Stop Recording Request from Floating Window
ipcMain.on('REQUEST_STOP_RECORDING', () => {
    if (win && !win.isDestroyed()) {
        win.webContents.send('STOP_RECORDING');
    }
    floatingWin?.hide();
    win?.show();
})

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
