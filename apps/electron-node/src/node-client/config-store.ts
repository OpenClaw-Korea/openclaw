import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export type GatewayConfig = {
  host?: string;
  port?: number;
  tls?: boolean;
  tlsFingerprint?: string;
};

export type NodeConfig = {
  version: 1;
  nodeId: string;
  token?: string;
  displayName?: string;
  gateway?: GatewayConfig;
};

const STATE_DIR = path.join(os.homedir(), ".openclaw-node-lite");
const CONFIG_FILE = path.join(STATE_DIR, "node.json");

export function getStateDir(): string {
  return STATE_DIR;
}

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeConfig(raw: Partial<NodeConfig> | null): NodeConfig {
  const config: NodeConfig = {
    version: 1,
    nodeId: "",
    token: raw?.token,
    displayName: raw?.displayName,
    gateway: raw?.gateway,
  };
  if (raw?.version === 1 && typeof raw.nodeId === "string") {
    config.nodeId = raw.nodeId.trim();
  }
  if (!config.nodeId) {
    config.nodeId = crypto.randomUUID();
  }
  return config;
}

export function loadConfig(): NodeConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {return null;}
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    return normalizeConfig(JSON.parse(raw) as Partial<NodeConfig>);
  } catch {
    return null;
  }
}

export function saveConfig(config: NodeConfig): void {
  ensureDir(CONFIG_FILE);
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
  } catch {
    // best-effort
  }
}

export function ensureConfig(): NodeConfig {
  const existing = loadConfig();
  const config = normalizeConfig(existing);
  saveConfig(config);
  return config;
}
