/// <reference types="vite/client" />

interface Window {
    ipcRenderer: {
        getScreenSources: () => Promise<any[]>;
        getScreenBounds: (sourceId: string) => Promise<{ x: number, y: number, width: number, height: number }>;
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, func: (...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    }
}
