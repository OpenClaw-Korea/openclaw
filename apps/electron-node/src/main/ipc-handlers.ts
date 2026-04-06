import { ipcMain } from "electron";
import { ensureConfig, saveConfig, type GatewayConfig } from "../node-client/config-store.js";
import type { GatewayClient } from "../node-client/gateway-client.js";

let clientRef: GatewayClient | null = null;

export function setClientRef(client: GatewayClient | null) {
  clientRef = client;
}

export function registerIpcHandlers() {
  ipcMain.handle("config:get", () => {
    return ensureConfig();
  });

  ipcMain.handle("config:save", (_event, gateway: GatewayConfig) => {
    const config = ensureConfig();
    config.gateway = { ...config.gateway, ...gateway };
    saveConfig(config);
    return config;
  });

  ipcMain.handle("connection:state", () => {
    return clientRef?.state ?? "disconnected";
  });

  ipcMain.handle("connection:reconnect", () => {
    if (clientRef) {
      clientRef.stop();
      clientRef.start();
    }
  });
}
