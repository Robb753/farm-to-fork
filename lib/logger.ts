type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function safeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { err };
}

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (isProd) return;
    console.debug(message, meta ?? "");
  },
  info: (message: string, meta?: unknown) => {
    if (isProd) return; // optionnel: tu peux autoriser info en prod si tu veux
    console.info(message, meta ?? "");
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(message, meta ?? "");
  },
  error: (message: string, err?: unknown, meta?: unknown) => {
    console.error(message, err ? safeError(err) : "", meta ?? "");
    // plus tard: envoyer à Sentry ici
  },
};
