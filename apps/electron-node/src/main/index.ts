import { app, ipcMain } from "electron";
import { createTray, updateTrayState, getSettingsWindow } from "./tray.js";
import { registerIpcHandlers, setClientRef } from "./ipc-handlers.js";
import { ensureConfig } from "../node-client/config-store.js";
import { loadOrCreateDeviceIdentity } from "../node-client/device-identity.js";
import { GatewayClient } from "../node-client/gateway-client.js";

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// Hide dock icon on macOS (tray-only app)
if (process.platform === "darwin") {
  app.dock?.hide();
}

let client: GatewayClient | null = null;

function startGatewayClient() {
  if (client) {
    client.stop();
    client = null;
  }

  const config = ensureConfig();
  const gw = config.gateway;
  const host = gw?.host?.trim() || "127.0.0.1";
  const port = gw?.port ?? 18789;
  const scheme = gw?.tls ? "wss" : "ws";
  const url = `${scheme}://${host}:${port}`;

  const identity = loadOrCreateDeviceIdentity();

  client = new GatewayClient({
    url,
    nodeId: config.nodeId,
    displayName: config.displayName,
    deviceIdentity: identity,
    token: config.token,
    tlsFingerprint: gw?.tlsFingerprint,
    events: {
      onStateChange: (state, detail) => {
        updateTrayState(state, detail);
        // Notify renderer if open
        const win = getSettingsWindow();
        if (win) {
          win.webContents.send("connection:state-changed", state, detail);
        }
      },
      onError: (err) => {
        console.error(`[gateway] ${err.message}`);
      },
    },
  });

  setClientRef(client);
  client.start();
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createTray();
  startGatewayClient();

  // Re-connect when config is saved from renderer
  ipcMain.on("gateway:restart", () => {
    startGatewayClient();
  });
});

app.on("window-all-closed", () => {
  // Don't quit — keep running in tray
});

app.on("before-quit", () => {
  if (client) {
    client.stop();
    client = null;
  }
});
