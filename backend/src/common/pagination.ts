/** Shared cursor-pagination helpers for "infinite scroll" list endpoints.
 *
 * Cursors are opaque to clients: a base64url-encoded `{ t, id }` pair where `t`
 * is the ISO timestamp of the ordering column and `id` breaks ties. Lists are
 * always ordered by `(t DESC, id DESC)`, so the "next page" is everything
 * strictly older than the cursor. */

export interface Page<T> {
  items: T[];
  /** Pass back as `?cursor=` to fetch the next page, or null when exhausted. */
  nextCursor: string | null;
}

export interface Cursor {
  t: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(raw?: string): Cursor | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      t?: unknown;
      id?: unknown;
    };
    if (typeof obj.t === 'string' && typeof obj.id === 'string') {
      return { t: obj.t, id: obj.id };
    }
  } catch {
    // Malformed cursor — treat as "from the start".
  }
  return null;
}
