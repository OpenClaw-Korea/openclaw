import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export type SystemRunParams = {
  command: string[];
  rawCommand?: string | null;
  cwd?: string | null;
  env?: Record<string, string>;
  timeoutMs?: number | null;
};

export type RunResult = {
  exitCode?: number;
  timedOut: boolean;
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string | null;
  truncated: boolean;
};

export type SystemWhichParams = {
  bins: string[];
};

const OUTPUT_CAP = 200_000;
const DEFAULT_NODE_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";

const blockedEnvKeys = new Set([
  "NODE_OPTIONS",
  "PYTHONHOME",
  "PYTHONPATH",
  "PERL5LIB",
  "PERL5OPT",
  "RUBYOPT",
]);

const blockedEnvPrefixes = ["DYLD_", "LD_"];

export function sanitizeEnv(
  overrides?: Record<string, string> | null,
): Record<string, string> | undefined {
  if (!overrides) {return undefined;}
  const merged = { ...process.env } as Record<string, string>;
  const basePath = process.env.PATH ?? DEFAULT_NODE_PATH;
  for (const [rawKey, value] of Object.entries(overrides)) {
    const key = rawKey.trim();
    if (!key) {continue;}
    const upper = key.toUpperCase();
    if (upper === "PATH") {
      const trimmed = value.trim();
      if (!trimmed) {continue;}
      if (!basePath || trimmed === basePath) {
        merged[key] = trimmed;
        continue;
      }
      const suffix = `${path.delimiter}${basePath}`;
      if (trimmed.endsWith(suffix)) {
        merged[key] = trimmed;
      }
      continue;
    }
    if (blockedEnvKeys.has(upper)) {continue;}
    if (blockedEnvPrefixes.some((prefix) => upper.startsWith(prefix))) {continue;}
    merged[key] = value;
  }
  return merged;
}

export async function runCommand(
  argv: string[],
  cwd: string | undefined,
  env: Record<string, string> | undefined,
  timeoutMs: number | undefined,
): Promise<RunResult> {
  return await new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let outputLen = 0;
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child = spawn(argv[0], argv.slice(1), {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    const onChunk = (chunk: Buffer, target: "stdout" | "stderr") => {
      if (outputLen >= OUTPUT_CAP) {
        truncated = true;
        return;
      }
      const remaining = OUTPUT_CAP - outputLen;
      const slice = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
      const str = slice.toString("utf8");
      outputLen += slice.length;
      if (target === "stdout") {
        stdout += str;
      } else {
        stderr += str;
      }
      if (chunk.length > remaining) {
        truncated = true;
      }
    };

    child.stdout?.on("data", (chunk) => onChunk(chunk as Buffer, "stdout"));
    child.stderr?.on("data", (chunk) => onChunk(chunk as Buffer, "stderr"));

    let timer: NodeJS.Timeout | undefined;
    if (timeoutMs && timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill("SIGKILL");
        } catch {
          // ignore
        }
      }, timeoutMs);
    }

    const finalize = (exitCode?: number, error?: string | null) => {
      if (settled) {return;}
      settled = true;
      if (timer) {clearTimeout(timer);}
      resolve({
        exitCode,
        timedOut,
        success: exitCode === 0 && !timedOut && !error,
        stdout,
        stderr,
        error: error ?? null,
        truncated,
      });
    };

    child.on("error", (err) => finalize(undefined, err.message));
    child.on("exit", (code) => finalize(code === null ? undefined : code, null));
  });
}

function resolveEnvPath(env?: Record<string, string>): string[] {
  const raw =
    env?.PATH ??
    (env as Record<string, string>)?.Path ??
    process.env.PATH ??
    process.env.Path ??
    DEFAULT_NODE_PATH;
  return raw.split(path.delimiter).filter(Boolean);
}

function resolveExecutable(bin: string, env?: Record<string, string>): string | null {
  if (bin.includes("/") || bin.includes("\\")) {return null;}
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").map((ext) => ext.toLowerCase())
      : [""];
  for (const dir of resolveEnvPath(env)) {
    for (const ext of extensions) {
      const candidate = path.join(dir, bin + ext);
      if (fs.existsSync(candidate)) {return candidate;}
    }
  }
  return null;
}

export function handleSystemWhich(params: SystemWhichParams, env?: Record<string, string>): { bins: Record<string, string> } {
  const bins = params.bins.map((b) => b.trim()).filter(Boolean);
  const found: Record<string, string> = {};
  for (const bin of bins) {
    const resolved = resolveExecutable(bin, env);
    if (resolved) {found[bin] = resolved;}
  }
  return { bins: found };
}
