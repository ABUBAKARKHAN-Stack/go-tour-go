import { describe, expect, test } from 'bun:test';

import { formatCount } from './format';

describe('formatCount', () => {
  test('small numbers stay as they are', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(342)).toBe('342');
    expect(formatCount(999)).toBe('999');
  });
  test('thousands and millions', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1200)).toBe('1.2K');
    expect(formatCount(12_480)).toBe('12.5K');
    expect(formatCount(250_000)).toBe('250K');
    expect(formatCount(1_200_000)).toBe('1.2M');
  });
});
