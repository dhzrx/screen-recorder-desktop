import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
const listeners = new Map<Function, Function>();

contextBridge.exposeInMainWorld('ipcRenderer', {
    on(channel: string, listener: (...args: any[]) => void) {
        const wrapper = (event: any, ...args: any[]) => listener(event, ...args);
        listeners.set(listener, wrapper);
        return ipcRenderer.on(channel, wrapper);
    },
    off(channel: string, listener: (...args: any[]) => void) {
        const wrapper = listeners.get(listener);
        if (wrapper) {
            listeners.delete(listener);
            // @ts-ignore
            return ipcRenderer.off(channel, wrapper);
        }
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    getScreenSources: () => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES'),
    getScreenBounds: (sourceId: string, displayId?: string) => ipcRenderer.invoke('GET_SCREEN_BOUNDS', sourceId, displayId),
})
