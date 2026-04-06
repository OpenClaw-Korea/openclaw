import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import type { DeviceIdentity } from "./device-identity.js";
import {
  buildDeviceAuthPayload,
  clearDeviceAuthToken,
  loadDeviceAuthToken,
  publicKeyRawBase64UrlFromPem,
  signDevicePayload,
  storeDeviceAuthToken,
} from "./device-identity.js";
import {
  runCommand,
  sanitizeEnv,
  handleSystemWhich,
  type SystemRunParams,
  type SystemWhichParams,
} from "./shell-executor.js";

const PROTOCOL_VERSION = 3;

export type ConnectionState = "disconnected" | "connecting" | "pairing" | "connected";

export type GatewayClientEvents = {
  onStateChange?: (state: ConnectionState, detail?: string) => void;
  onError?: (err: Error) => void;
};

export type GatewayClientOptions = {
  url: string;
  nodeId: string;
  displayName?: string;
  deviceIdentity: DeviceIdentity;
  token?: string;
  tlsFingerprint?: string;
  events?: GatewayClientEvents;
};

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
};

type EventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
};

type ResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code?: string; message?: string };
};

type RequestFrame = {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
};

type NodeInvokeRequest = {
  id: string;
  nodeId: string;
  command: string;
  paramsJSON?: string | null;
  timeoutMs?: number | null;
  idempotencyKey?: string | null;
};

type HelloOk = {
  protocol: number;
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
  };
  policy?: {
    tickIntervalMs?: number;
  };
};

const OUTPUT_EVENT_TAIL = 20_000;
const REQUEST_TIMEOUT_MS = 30_000;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private opts: GatewayClientOptions;
  private pending = new Map<string, Pending>();
  private backoffMs = 1000;
  private closed = false;
  private connectNonce: string | null = null;
  private connectSent = false;
  private connectTimer: NodeJS.Timeout | null = null;
  private lastTick: number | null = null;
  private tickIntervalMs = 30_000;
  private tickTimer: NodeJS.Timeout | null = null;
  private _state: ConnectionState = "disconnected";

  constructor(opts: GatewayClientOptions) {
    this.opts = opts;
  }

  get state(): ConnectionState {
    return this._state;
  }

  start() {
    if (this.closed) {return;}
    this.setState("connecting");
    const { url } = this.opts;

    const wsOptions: WebSocket.ClientOptions = {
      maxPayload: 25 * 1024 * 1024,
    };
    if (url.startsWith("wss://") && this.opts.tlsFingerprint) {
      // Allow self-signed certs when TLS fingerprint pinning is configured (local/private network use)
      wsOptions.rejectUnauthorized = false;
    }

    this.ws = new WebSocket(url, wsOptions);

    this.ws.on("open", () => {
      this.queueConnect();
    });
    this.ws.on("message", (data) => this.handleMessage(rawDataToString(data)));
    this.ws.on("close", (code, reason) => {
      const reasonText = rawDataToString(reason);
      this.ws = null;
      this.flushPendingErrors(new Error(`gateway closed (${code}): ${reasonText}`));
      this.setState("disconnected", `${code}: ${reasonText}`);
      this.scheduleReconnect();
    });
    this.ws.on("error", (err) => {
      if (!this.connectSent) {
        this.opts.events?.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  stop() {
    this.closed = true;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.flushPendingErrors(new Error("client stopped"));
    this.setState("disconnected");
  }

  private setState(state: ConnectionState, detail?: string) {
    this._state = state;
    this.opts.events?.onStateChange?.(state, detail);
  }

  private queueConnect() {
    this.connectNonce = null;
    this.connectSent = false;
    if (this.connectTimer) {clearTimeout(this.connectTimer);}
    this.connectTimer = setTimeout(() => this.sendConnect(), 750);
  }

  private sendConnect() {
    if (this.connectSent) {return;}
    this.connectSent = true;
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    const role = "node";
    const storedToken = loadDeviceAuthToken({
      deviceId: this.opts.deviceIdentity.deviceId,
      role,
    })?.token;
    const authToken = storedToken ?? this.opts.token ?? undefined;
    const canFallbackToShared = Boolean(storedToken && this.opts.token);

    const auth =
      authToken ? { token: authToken } : undefined;

    const signedAtMs = Date.now();
    const nonce = this.connectNonce ?? undefined;
    const scopes: string[] = [];

    const payload = buildDeviceAuthPayload({
      deviceId: this.opts.deviceIdentity.deviceId,
      clientId: "node-host",
      clientMode: "node",
      role,
      scopes,
      signedAtMs,
      token: authToken ?? null,
      nonce,
    });
    const signature = signDevicePayload(this.opts.deviceIdentity.privateKeyPem, payload);

    const device = {
      id: this.opts.deviceIdentity.deviceId,
      publicKey: publicKeyRawBase64UrlFromPem(this.opts.deviceIdentity.publicKeyPem),
      signature,
      signedAt: signedAtMs,
      nonce,
    };

    const params = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: "node-host",
        displayName: this.opts.displayName ?? undefined,
        version: "1.0.0",
        platform: process.platform,
        mode: "node",
        instanceId: this.opts.nodeId,
      },
      caps: ["system"],
      commands: ["system.run", "system.which"],
      pathEnv: process.env.PATH ?? "",
      auth,
      role,
      scopes,
      device,
    };

    this.setState("pairing");

    void this.request<HelloOk>("connect", params)
      .then((helloOk) => {
        const authInfo = helloOk?.auth;
        if (authInfo?.deviceToken) {
          storeDeviceAuthToken({
            deviceId: this.opts.deviceIdentity.deviceId,
            role: authInfo.role ?? role,
            token: authInfo.deviceToken,
            scopes: authInfo.scopes ?? [],
          });
        }
        this.backoffMs = 1000;
        this.tickIntervalMs =
          typeof helloOk.policy?.tickIntervalMs === "number"
            ? helloOk.policy.tickIntervalMs
            : 30_000;
        this.lastTick = Date.now();
        this.startTickWatch();
        this.setState("connected", this.opts.url);
      })
      .catch((err) => {
        if (canFallbackToShared) {
          clearDeviceAuthToken({
            deviceId: this.opts.deviceIdentity.deviceId,
            role,
          });
        }
        this.opts.events?.onError?.(err instanceof Error ? err : new Error(String(err)));
        this.ws?.close(1008, "connect failed");
      });
  }

  private handleMessage(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      const type = parsed?.type;

      // Event frame
      if (type === "event") {
        const evt = parsed as EventFrame;
        if (evt.event === "connect.challenge") {
          const payload = evt.payload as { nonce?: string } | undefined;
          if (payload?.nonce) {
            this.connectNonce = payload.nonce;
            this.sendConnect();
          }
          return;
        }
        if (evt.event === "tick") {
          this.lastTick = Date.now();
        }
        if (evt.event === "node.invoke.request") {
          void this.handleInvoke(evt.payload);
        }
        return;
      }

      // Response frame
      if (type === "res") {
        const res = parsed as ResponseFrame;
        const pending = this.pending.get(res.id);
        if (!pending) {return;}
        this.pending.delete(res.id);
        if (res.ok) {
          pending.resolve(res.payload);
        } else {
          pending.reject(new Error(res.error?.message ?? "unknown error"));
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  private async handleInvoke(rawPayload: unknown) {
    const frame = coerceInvokePayload(rawPayload);
    if (!frame) {return;}

    const { command } = frame;

    if (command === "system.which") {
      try {
        const params = decodeParams<SystemWhichParams>(frame.paramsJSON);
        if (!Array.isArray(params.bins)) {throw new Error("bins required");}
        const result = handleSystemWhich(params, sanitizeEnv(undefined));
        await this.sendInvokeResult(frame, { ok: true, payloadJSON: JSON.stringify(result) });
      } catch (err) {
        await this.sendInvokeResult(frame, {
          ok: false,
          error: { code: "INVALID_REQUEST", message: String(err) },
        });
      }
      return;
    }

    if (command !== "system.run") {
      await this.sendInvokeResult(frame, {
        ok: false,
        error: { code: "UNAVAILABLE", message: "command not supported" },
      });
      return;
    }

    let params: SystemRunParams;
    try {
      params = decodeParams<SystemRunParams>(frame.paramsJSON);
    } catch (err) {
      await this.sendInvokeResult(frame, {
        ok: false,
        error: { code: "INVALID_REQUEST", message: String(err) },
      });
      return;
    }

    if (!Array.isArray(params.command) || params.command.length === 0) {
      await this.sendInvokeResult(frame, {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "command required" },
      });
      return;
    }

    const argv = params.command.map((item) => String(item));
    const env = sanitizeEnv(params.env ?? undefined);

    const result = await runCommand(
      argv,
      params.cwd?.trim() || undefined,
      env,
      params.timeoutMs ?? undefined,
    );

    if (result.truncated) {
      const suffix = "... (truncated)";
      if (result.stderr.trim().length > 0) {
        result.stderr = `${result.stderr}\n${suffix}`;
      } else {
        result.stdout = `${result.stdout}\n${suffix}`;
      }
    }

    const combined = [result.stdout, result.stderr, result.error].filter(Boolean).join("\n");
    const trimmed = combined.trim();
    const eventOutput = trimmed.length > OUTPUT_EVENT_TAIL
      ? `... (truncated) ${trimmed.slice(trimmed.length - OUTPUT_EVENT_TAIL)}`
      : trimmed;

    await this.sendNodeEvent("exec.finished", {
      sessionKey: "node",
      runId: randomUUID(),
      host: "node",
      command: argv.join(" "),
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      success: result.success,
      output: eventOutput,
    });

    await this.sendInvokeResult(frame, {
      ok: true,
      payloadJSON: JSON.stringify({
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error ?? null,
      }),
    });
  }

  private async sendInvokeResult(
    frame: NodeInvokeRequest,
    result: {
      ok: boolean;
      payloadJSON?: string;
      error?: { code?: string; message?: string };
    },
  ) {
    const params: Record<string, unknown> = {
      id: frame.id,
      nodeId: frame.nodeId,
      ok: result.ok,
    };
    if (result.payloadJSON) {params.payloadJSON = result.payloadJSON;}
    if (result.error) {params.error = result.error;}
    try {
      await this.request("node.invoke.result", params);
    } catch {
      // best-effort
    }
  }

  private async sendNodeEvent(event: string, payload: unknown) {
    try {
      await this.request("node.event", {
        event,
        payloadJSON: payload ? JSON.stringify(payload) : null,
      });
    } catch {
      // best-effort
    }
  }

  private scheduleReconnect() {
    if (this.closed) {return;}
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
    setTimeout(() => this.start(), delay).unref();
  }

  private flushPendingErrors(err: Error) {
    for (const [, p] of this.pending) {
      p.reject(err);
    }
    this.pending.clear();
  }

  private startTickWatch() {
    if (this.tickTimer) {clearInterval(this.tickTimer);}
    const interval = Math.max(this.tickIntervalMs, 1000);
    this.tickTimer = setInterval(() => {
      if (this.closed || !this.lastTick) {return;}
      const gap = Date.now() - this.lastTick;
      if (gap > this.tickIntervalMs * 2) {
        this.ws?.close(4000, "tick timeout");
      }
    }, interval);
  }

  async request<T = Record<string, unknown>>(method: string, params?: unknown): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("gateway not connected");
    }
    const id = randomUUID();
    const frame: RequestFrame = { type: "req", id, method, params };
    const p = new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`request timeout (${REQUEST_TIMEOUT_MS}ms): ${method}`));
        }
      }, REQUEST_TIMEOUT_MS);
      timer.unref();
    });
    this.ws.send(JSON.stringify(frame));
    return p;
  }
}

function rawDataToString(data: unknown): string {
  if (typeof data === "string") {return data;}
  if (Buffer.isBuffer(data)) {return data.toString("utf8");}
  if (data instanceof ArrayBuffer) {return Buffer.from(data).toString("utf8");}
  if (Array.isArray(data)) {return Buffer.concat(data).toString("utf8");}
  return String(data);
}

function coerceInvokePayload(payload: unknown): NodeInvokeRequest | null {
  if (!payload || typeof payload !== "object") {return null;}
  const obj = payload as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id.trim() : "";
  const nodeId = typeof obj.nodeId === "string" ? obj.nodeId.trim() : "";
  const command = typeof obj.command === "string" ? obj.command.trim() : "";
  if (!id || !nodeId || !command) {return null;}
  const paramsJSON =
    typeof obj.paramsJSON === "string"
      ? obj.paramsJSON
      : obj.params !== undefined
        ? JSON.stringify(obj.params)
        : null;
  const timeoutMs = typeof obj.timeoutMs === "number" ? obj.timeoutMs : null;
  const idempotencyKey = typeof obj.idempotencyKey === "string" ? obj.idempotencyKey : null;
  return { id, nodeId, command, paramsJSON, timeoutMs, idempotencyKey };
}

function decodeParams<T>(raw?: string | null): T {
  if (!raw) {throw new Error("paramsJSON required");}
  return JSON.parse(raw) as T;
}
