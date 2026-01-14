const isProd = process.env.NODE_ENV === "production";

// Optionnel : si tu veux couper aussi warn en prod, passe à true/false
const allowWarnInProd = true;

function safeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { err };
}

function normalizeMeta(meta: unknown) {
  if (meta === undefined) return undefined;
  try {
    // évite les grosses sorties / circular refs
    return JSON.parse(JSON.stringify(meta));
  } catch {
    return meta;
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (isProd) return;
    console.debug(message, normalizeMeta(meta));
  },
  info: (message: string, meta?: unknown) => {
    if (isProd) return;
    console.info(message, normalizeMeta(meta));
  },
  warn: (message: string, meta?: unknown) => {
    if (isProd && !allowWarnInProd) return;
    console.warn(message, normalizeMeta(meta));
  },
  error: (message: string, err?: unknown, meta?: unknown) => {
    console.error(
      message,
      err ? safeError(err) : undefined,
      normalizeMeta(meta)
    );
    // plus tard: Sentry.captureException(err, { extra: meta })
  },
};
