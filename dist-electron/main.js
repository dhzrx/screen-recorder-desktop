"use strict";
const electron = require("electron");
const path = require("node:path");
electron.ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", async () => {
  return electron.desktopCapturer.getSources({ types: ["window", "screen"] });
});
electron.ipcMain.handle("GET_SCREEN_BOUNDS", async (_event, sourceId) => {
  const displays = electron.screen.getAllDisplays();
  const parts = sourceId.split(":");
  if (parts[0] === "screen") {
    const displayId = parseInt(parts[1], 10);
    const display = displays.find((d) => d.id === displayId);
    if (display) {
      return display.bounds;
    }
  }
  return electron.screen.getPrimaryDisplay().bounds;
});
electron.ipcMain.on("REQUEST_STOP_RECORDING", () => {
  if (win && !win.isDestroyed()) {
    win.webContents.send("STOP_RECORDING");
  }
  floatingWin == null ? void 0 : floatingWin.hide();
  win == null ? void 0 : win.show();
});
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : path.join(__dirname, "../public");
let win;
let floatingWin;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new electron.BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
function createFloatingWindow() {
  floatingWin = new electron.BrowserWindow({
    width: 300,
    height: 60,
    type: "toolbar",
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (VITE_DEV_SERVER_URL) {
    floatingWin.loadURL(VITE_DEV_SERVER_URL + "#floating");
  } else {
    floatingWin.loadFile(path.join(process.env.DIST, "index.html"), { hash: "floating" });
  }
  floatingWin.hide();
}
electron.ipcMain.on("SHOW_FLOATING_CONTROLS", () => {
  if (!floatingWin || floatingWin.isDestroyed()) {
    createFloatingWindow();
  }
  floatingWin == null ? void 0 : floatingWin.show();
});
electron.ipcMain.on("HIDE_FLOATING_CONTROLS", () => {
  floatingWin == null ? void 0 : floatingWin.hide();
  win == null ? void 0 : win.show();
});
electron.app.whenReady().then(() => {
  createWindow();
  createFloatingWindow();
  setInterval(() => {
    const point = electron.screen.getCursorScreenPoint();
    if (win && !win.isDestroyed()) {
      win.webContents.send("cursor-position", point);
    }
    if (floatingWin && !floatingWin.isDestroyed() && floatingWin.isVisible()) {
      floatingWin.webContents.send("cursor-position", point);
    }
  }, 16);
});
