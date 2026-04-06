declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<{ gateway?: { host?: string; port?: number; tls?: boolean; tlsFingerprint?: string }; nodeId: string }>;
      saveConfig: (gateway: unknown) => Promise<void>;
      reconnect: () => Promise<void>;
      getConnectionState: () => Promise<string>;
      restartGateway: () => void;
      onStateChanged: (callback: (state: string, detail?: string) => void) => void;
    };
  }
}

const STATE_LABELS: Record<string, string> = {
  disconnected: "연결 끊김",
  connecting: "연결 중...",
  pairing: "페어링 대기 중...",
  connected: "연결됨",
};

const hostInput = document.getElementById("host") as HTMLInputElement;
const portInput = document.getElementById("port") as HTMLInputElement;
const tlsCheckbox = document.getElementById("tls") as HTMLInputElement;
const fingerprintGroup = document.getElementById("fingerprintGroup") as HTMLDivElement;
const fingerprintInput = document.getElementById("tlsFingerprint") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const reconnectBtn = document.getElementById("reconnectBtn") as HTMLButtonElement;
const statusDot = document.getElementById("statusDot") as HTMLDivElement;
const statusText = document.getElementById("statusText") as HTMLSpanElement;
const nodeIdEl = document.getElementById("nodeId") as HTMLDivElement;

function updateStatus(state: string, detail?: string) {
  statusDot.className = `status-dot ${state}`;
  const label = STATE_LABELS[state] ?? state;
  const suffix = state === "connected" && detail ? ` — ${detail}` : "";
  statusText.textContent = `${label}${suffix}`;
}

tlsCheckbox.addEventListener("change", () => {
  fingerprintGroup.style.display = tlsCheckbox.checked ? "block" : "none";
});

async function loadConfig() {
  const config = await window.electronAPI.getConfig();
  if (config) {
    hostInput.value = config.gateway?.host ?? "";
    portInput.value = config.gateway?.port?.toString() ?? "";
    tlsCheckbox.checked = config.gateway?.tls ?? false;
    fingerprintInput.value = config.gateway?.tlsFingerprint ?? "";
    fingerprintGroup.style.display = tlsCheckbox.checked ? "block" : "none";
    nodeIdEl.textContent = `Node ID: ${config.nodeId}`;
  }
  const state = await window.electronAPI.getConnectionState();
  updateStatus(state);
}

saveBtn.addEventListener("click", async () => {
  const gateway = {
    host: hostInput.value.trim() || "127.0.0.1",
    port: parseInt(portInput.value, 10) || 18789,
    tls: tlsCheckbox.checked,
    tlsFingerprint: fingerprintInput.value.trim() || undefined,
  };
  await window.electronAPI.saveConfig(gateway);
  window.electronAPI.restartGateway();
});

reconnectBtn.addEventListener("click", async () => {
  await window.electronAPI.reconnect();
});

window.electronAPI.onStateChanged((state: string, detail?: string) => {
  updateStatus(state, detail);
});

void loadConfig();
