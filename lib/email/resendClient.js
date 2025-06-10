import { Resend } from "resend";

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.warn("[WARN] RESEND_API_KEY manquante.");
    return null;
  }

  return new Resend(key);
}
