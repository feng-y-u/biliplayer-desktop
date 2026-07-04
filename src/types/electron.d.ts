// src/types/electron.d.ts

interface Window {
  electronAPI: {
    api: (message: any) => Promise<any>;
    storeGet: (key: string) => Promise<any>;
    storeSet: (key: string, value: any) => Promise<void>;
    windowMove: (x: number, y: number) => Promise<void>;
    windowResize: (w: number, h: number) => Promise<void>;
    windowGetPosition: () => Promise<{ x: number; y: number; width: number; height: number }>;
    windowSetMinimumSize: (w: number, h: number) => Promise<void>;
  };
}
