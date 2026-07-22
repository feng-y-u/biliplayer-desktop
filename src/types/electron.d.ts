import type { IpcMessage, IpcResponse } from './ipc';

export interface ElectronAPI {
  api: <T extends IpcMessage>(message: T) => Promise<IpcResponse<T['type']>>;
  storeGet: (key: string) => Promise<any>;
  storeSet: (key: string, value: any) => Promise<void>;
  windowMove: (x: number, y: number) => Promise<void>;
  windowResize: (w: number, h: number) => Promise<void>;
  windowGetPosition: () => Promise<{ x: number; y: number; width: number; height: number }>;
  windowSetMinimumSize: (w: number, h: number) => Promise<void>;

  /** 二维码登录 */
  loginQrcodeStart: () => Promise<QrCodeState>;
  loginQrcodePoll: () => Promise<QrCodeState>;
  loginQrcodeCancel: () => Promise<void>;
  loginCheck: () => Promise<{ loggedIn: boolean }>;
  loginLogout: () => Promise<void>;
}

export interface QrCodeState {
  status: 'LOADING' | 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'EXPIRED' | 'ERROR';
  message: string;
  qrUrl?: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
