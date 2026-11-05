import { expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * React Query data is saved to the phone as JSON and restored on the next
 * start. A Map or Set comes back as {} and crashes the first screen that calls
 * .get() / .has() on it (seen on Home after a restart). Query functions must
 * return plain objects and arrays.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !name.includes('.test.') ? [path] : [];
  });
}

test('query functions return JSON-safe data (no Map or Set)', () => {
  const offenders: string[] = [];
  for (const file of files(join(import.meta.dir, '..'))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.includes('queryFn')) return;
      const body = lines.slice(i, i + 12).join('\n');
      if (/return new (Map|Set)\b/.test(body)) offenders.push(`${file}:${i + 1}`);
    });
  }
  expect(offenders).toEqual([]);
});
