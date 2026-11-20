/**
 * Whether a screen is still waiting for its data. React Query's `isLoading`
 * is false while a request is *paused* waiting for the connection (offline),
 * so screens using it alone fell through to "No posts yet"-style empty
 * states. This counts a paused first load as waiting too; the shared
 * LoadingState then says "You're offline" (and the data loads by itself
 * when the connection is back).
 */
type QueryLike = { isLoading: boolean; isPending: boolean; fetchStatus: 'fetching' | 'paused' | 'idle' };

export function isWaiting(q: QueryLike): boolean {
  return q.isLoading || (q.isPending && q.fetchStatus === 'paused');
}
