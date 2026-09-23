import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ApiErrorBody } from '../../shared/types.js';

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

export function sendError(res: VercelResponse, status: number, error: string, message: string): void {
  const body: ApiErrorBody = { error, message };
  sendJson(res, status, body);
}

/** Wraps a handler so any thrown error becomes a clean JSON 500 instead of a
 * blank Vercel crash page, and logs the real error server-side. */
export function withErrorHandling(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      sendError(
        res,
        502,
        'upstream_error',
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    }
  };
}

export function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
