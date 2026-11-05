/** Turns Supabase/fetch/unknown errors into a short, user-facing message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const e = error as { message?: unknown; error_description?: unknown; code?: unknown };
    const msg = typeof e.message === 'string' ? e.message : typeof e.error_description === 'string' ? e.error_description : '';
    if (/network request failed|failed to fetch|fetch failed/i.test(msg)) {
      return 'No internet connection. Check your network and try again.';
    }
    if (e.code === '23505') return 'That already exists.';
    if (msg) return msg;
  }
  return fallback;
}
