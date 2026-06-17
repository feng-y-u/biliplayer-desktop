"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  api: (message) => import_electron.ipcRenderer.invoke("api", message),
  storeGet: (key) => import_electron.ipcRenderer.invoke("store:get", key),
  storeSet: (key, value) => import_electron.ipcRenderer.invoke("store:set", key, value),
  windowMove: (x, y) => import_electron.ipcRenderer.send("window:move", x, y),
  windowResize: (w, h) => import_electron.ipcRenderer.invoke("window:resize", w, h),
  windowGetPosition: () => import_electron.ipcRenderer.invoke("window:getPosition"),
  windowSetMinimumSize: (w, h) => import_electron.ipcRenderer.invoke("window:setMinimumSize", w, h)
});
