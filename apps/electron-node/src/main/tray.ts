import { app, Menu, Tray, nativeImage, BrowserWindow } from "electron";
import path from "node:path";
import type { ConnectionState } from "../node-client/gateway-client.js";
import { getAutoLaunchEnabled, setAutoLaunch } from "./auto-launch.js";

let isQuitting = false;
app.on("before-quit", () => {
  isQuitting = true;
});

let tray: Tray | null = null;
let connectionState: ConnectionState = "disconnected";
let connectionDetail = "";
let settingsWindow: BrowserWindow | null = null;

const STATE_LABELS: Record<ConnectionState, string> = {
  disconnected: "연결 끊김",
  connecting: "연결 중...",
  pairing: "페어링 대기...",
  connected: "연결됨",
};

function getIconPath(): string {
  const iconFile = process.platform === "win32" ? "icon.ico" : "icon.png";
  // In dev: assets is sibling to src; in production: assets is in app root
  const devPath = path.join(__dirname, "..", "..", "assets", iconFile);
  const prodPath = path.join(process.resourcesPath, "assets", iconFile);
  try {
    require("node:fs").accessSync(devPath);
    return devPath;
  } catch {
    return prodPath;
  }
}

function buildMenu(): Menu {
  const stateLabel = STATE_LABELS[connectionState] ?? "알 수 없음";
  const detail = connectionState === "connected" && connectionDetail ? ` (${connectionDetail})` : "";
  const autoLaunch = getAutoLaunchEnabled();

  return Menu.buildFromTemplate([
    { label: `상태: ${stateLabel}${detail}`, enabled: false },
    { type: "separator" },
    {
      label: "설정 열기",
      click: () => openSettingsWindow(),
    },
    {
      label: "시작 시 자동 실행",
      type: "checkbox",
      checked: autoLaunch,
      click: (menuItem) => setAutoLaunch(menuItem.checked),
    },
    { type: "separator" },
    { label: "종료", click: () => app.quit() },
  ]);
}

export function createTray(): Tray {
  const iconPath = getIconPath();
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (process.platform === "darwin") {
      icon = icon.resize({ width: 16, height: 16 });
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("OpenClaw Node");
  tray.setContextMenu(buildMenu());

  tray.on("click", () => {
    openSettingsWindow();
  });

  return tray;
}

export function updateTrayState(state: ConnectionState, detail?: string) {
  connectionState = state;
  connectionDetail = detail ?? "";
  if (tray) {
    tray.setContextMenu(buildMenu());
  }
}

export function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 380,
    resizable: false,
    maximizable: false,
    title: "OpenClaw Node — 설정",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "preload", "preload.js"),
    },
    show: false,
  });

  const htmlPath = path.join(__dirname, "..", "renderer", "index.html");
  settingsWindow.loadFile(htmlPath);

  settingsWindow.once("ready-to-show", () => {
    settingsWindow?.show();
  });

  settingsWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      settingsWindow?.hide();
    }
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
}
