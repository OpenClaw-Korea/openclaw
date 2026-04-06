import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (gateway: unknown) => ipcRenderer.invoke("config:save", gateway),
  reconnect: () => ipcRenderer.invoke("connection:reconnect"),
  getConnectionState: () => ipcRenderer.invoke("connection:state"),
  restartGateway: () => ipcRenderer.send("gateway:restart"),
  onStateChanged: (callback: (state: string, detail?: string) => void) => {
    ipcRenderer.on("connection:state-changed", (_event, state: string, detail?: string) => {
      callback(state, detail);
    });
  },
});
