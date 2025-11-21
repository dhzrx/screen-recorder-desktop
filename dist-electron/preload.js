"use strict";
const electron = require("electron");
const listeners = /* @__PURE__ */ new Map();
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(channel, listener) {
    const wrapper = (event, ...args) => listener(event, ...args);
    listeners.set(listener, wrapper);
    return electron.ipcRenderer.on(channel, wrapper);
  },
  off(channel, listener) {
    const wrapper = listeners.get(listener);
    if (wrapper) {
      listeners.delete(listener);
      return electron.ipcRenderer.off(channel, wrapper);
    }
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  getScreenSources: () => electron.ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES"),
  getScreenBounds: (sourceId, displayId) => electron.ipcRenderer.invoke("GET_SCREEN_BOUNDS", sourceId, displayId)
});
