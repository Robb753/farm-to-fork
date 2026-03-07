// lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

type LoggerMeta = Record<string, unknown> | unknown;

const isProd =
  typeof process !== "undefined" && process.env?.NODE_ENV === "production";

// En prod: debug/info coupés. warn configurable.
const allowWarnInProd = true;

// Limite la taille pour éviter des logs gigantesques en prod/dev
const MAX_STR_LEN = 2000;

function safeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: (err as any).cause,
    };
  }
  return err;
}

function truncateStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_STR_LEN
      ? value.slice(0, MAX_STR_LEN) + "…"
      : value;
  }
  if (Array.isArray(value)) return value.map(truncateStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        truncateStrings(v),
      ])
    ) as Record<string, unknown>;
  }
  return value;
}

function normalizeMeta(meta: LoggerMeta) {
  if (meta === undefined) return undefined;

  // On essaie de “décirculariser” sans exploser si circular refs
  try {
    const json = JSON.stringify(meta);
    return truncateStrings(JSON.parse(json));
  } catch {
    return truncateStrings(meta);
  }
}

function shouldLog(level: LogLevel) {
  if (!isProd) return true;
  if (level === "error") return true;
  if (level === "warn") return allowWarnInProd;
  return false; // debug/info off en prod
}

// Hook optionnel (Sentry plus tard)
let onErrorHook: ((err: unknown, meta?: unknown) => void) | null = null;
export function setLoggerOnErrorHook(
  fn: (err: unknown, meta?: unknown) => void
) {
  onErrorHook = fn;
}

export const logger = {
  debug(message: string, meta?: LoggerMeta) {
    if (!shouldLog("debug")) return;
    console.debug(message, normalizeMeta(meta));
  },
  info(message: string, meta?: LoggerMeta) {
    if (!shouldLog("info")) return;
    console.info(message, normalizeMeta(meta));
  },
  warn(message: string, meta?: LoggerMeta) {
    if (!shouldLog("warn")) return;
    console.warn(message, normalizeMeta(meta));
  },
  error(message: string, err?: unknown, meta?: LoggerMeta) {
    // error toujours loggé
    console.error(
      message,
      err ? safeError(err) : undefined,
      normalizeMeta(meta)
    );
    onErrorHook?.(err, meta);
  },
};
