import { NextResponse } from "next/server";

/**
 * Réponse de succès normalisée.
 * Shape: { success: true, ...data }
 */
export function apiOk<T extends Record<string, unknown>>(
  data: T,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status, headers });
}

/**
 * Réponse d'erreur normalisée.
 * Shape: { success: false, error, details? }
 *
 * @param details - Toujours inclus (ex: erreurs Zod). Pour les détails dev uniquement,
 *                  passer `process.env.NODE_ENV === 'development' ? msg : undefined`.
 */
export function apiError(
  message: string,
  status: number,
  details?: string | string[],
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}
