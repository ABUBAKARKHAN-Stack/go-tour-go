import { describe, expect, test } from 'bun:test';

import { hasArabicScript, likePattern, scoreMatch, squash } from './search-text';

describe('squash', () => {
  test('unifies common romanisations', () => {
    expect(squash('Qayyumabad')).toBe(squash('qayumabad'));
    expect(squash('Gulshan-e-Iqbal')).toBe(squash('gulshan iqbal'));
    expect(squash('Saddar')).toBe(squash('Sadar'));
    expect(squash('  Clifton   Beach ')).toBe('cliftonbeach');
  });

  test('strips accents and punctuation', () => {
    expect(squash('Shāh Rukn-e-Ālam')).toBe('shahruknalam');
    expect(squash("Quaid's Mausoleum")).toBe('quaidsmausoleum');
  });

  test('keeps Urdu text', () => {
    expect(hasArabicScript('قیوم آباد')).toBe(true);
    expect(squash('قیوم آباد')).toBe(squash('قیوم اباد'));
    expect(squash('قیوم آباد')).toBe('قیوماباد');
  });
});

describe('likePattern', () => {
  test('escapes wildcards', () => {
    expect(likePattern('a_b%')).toBe('%a\\_b\\%%');
  });
});

describe('scoreMatch', () => {
  test('exact > prefix > substring', () => {
    const q = squash('qayyumabad');
    const exact = scoreMatch(squash('Qayyumabad'), q, 50, 1000);
    const prefix = scoreMatch(squash('Qayyumabad Chowrangi'), q, 50, 1000);
    const sub = scoreMatch(squash('New Qayyumabad'), q, 50, 1000);
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(sub);
  });

  test('nearby wins between equal matches', () => {
    expect(scoreMatch('saddar', 'saddar', 60, 2_000)).toBeGreaterThan(scoreMatch('saddar', 'saddar', 60, 900_000));
  });
});
