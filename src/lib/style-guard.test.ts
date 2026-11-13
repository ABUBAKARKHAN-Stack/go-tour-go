import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Uniwind turns Tailwind's start/end utilities (ps-4, pe-2, ms-, me-,
 * start-3, end-3) into style names React Native ignores (e.g.
 * "paddingHorizontalStart"), so they silently do nothing on the phone. Use
 * the style props instead: paddingStart, paddingEnd, marginStart, marginEnd,
 * start, end (they still flip for Urdu).
 */
const BROKEN = /className=[^>]*?(?<![\w-])(ps|pe|ms|me|start|end)-(\d|\[)/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

describe('styles', () => {
  test('no start/end utility classes (they do nothing on the phone)', () => {
    const offenders = files(join(import.meta.dir, '..')).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => (BROKEN.test(line) ? `${file}:${i + 1}` : null))
        .filter((x): x is string => x !== null),
    );
    expect(offenders).toEqual([]);
  });
});
