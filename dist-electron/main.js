"use strict";
const electron = require("electron");
const path = require("node:path");
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
electron.ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", async (_event, opts) => {
  const sources = await electron.desktopCapturer.getSources({ types: ["window", "screen"] });
  return sources;
});
electron.ipcMain.handle("GET_SCREEN_BOUNDS", async (_event, sourceId, displayId) => {
  const displays = electron.screen.getAllDisplays();
  console.log("[Main] GET_SCREEN_BOUNDS request. SourceID:", sourceId, "DisplayID:", displayId);
  if (displayId) {
    const id = parseInt(displayId, 10);
    const display = displays.find((d) => d.id === id);
    if (display) {
      console.log("[Main] Found Display by displayId:", display.bounds);
      return display.bounds;
    }
  }
  const parts = sourceId.split(":");
  if (parts[0] === "screen") {
    const id = parseInt(parts[1], 10);
    const display = displays.find((d) => d.id === id);
    if (display) {
      console.log("[Main] Found Display by sourceId parse:", display.bounds);
      return display.bounds;
    }
  }
  console.log("[Main] Fallback to Primary Display");
  return electron.screen.getPrimaryDisplay().bounds;
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
