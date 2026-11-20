import { describe, expect, test } from 'bun:test';

import { formatCrowDistance } from './geo';
import { isWaiting } from './query-state';

describe('waiting for data', () => {
  test('loading, or paused for the connection, counts as waiting', () => {
    expect(isWaiting({ isLoading: true, isPending: true, fetchStatus: 'fetching' })).toBe(true);
    // Offline: the first load is paused, not "loading", and must not look like an empty result.
    expect(isWaiting({ isLoading: false, isPending: true, fetchStatus: 'paused' })).toBe(true);
    // A disabled query (e.g. signed out) is not waiting.
    expect(isWaiting({ isLoading: false, isPending: true, fetchStatus: 'idle' })).toBe(false);
    // Data already there (even while refreshing offline) is shown.
    expect(isWaiting({ isLoading: false, isPending: false, fetchStatus: 'paused' })).toBe(false);
  });
});

describe('straight-line distance label', () => {
  test('marked as approximate', () => {
    expect(formatCrowDistance(2000)).toBe('≈ 2.0 km');
    expect(formatCrowDistance(640)).toBe('≈ 640 m');
    expect(formatCrowDistance(Number.NaN)).toBe('');
  });
});
