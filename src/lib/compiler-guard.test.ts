/**
 * The React Compiler caches values computed during render that don't depend
 * on props or state, computing them once (a `memo_cache_sentinel` block).
 * Reading changing module state there (a store's .get(), routeIndex(),
 * storage, the clock) freezes it: the journey map once kept drawing the first
 * route's line after every switch or re-route. This compiles each screen and
 * component and fails if such a read is cached outside a callback.
 */
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { transformSync } from '@babel/core';

const ROOT = join(import.meta.dir, '..', '..');
const SUSPECT = /(\b\w+Store\.get\(\)|\bsimulator\.get\(\)|\brouteIndex\(\)|\bstorage\.get\b|\bgetMeta\(|Date\.now\(\)|new Date\(\)|onlineManager\.isOnline\(\)|\breadStoredJourney\(|\bgetPreferences\(\))/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx$/.test(name) || /^use-.*\.ts$/.test(name) ? [p] : [];
  });
}

/** The block's text with nested function bodies removed (they run later, at call time). */
function withoutFunctionBodies(block: string) {
  let out = '';
  let i = 0;
  while (i < block.length) {
    const rest = block.slice(i);
    const fn = /^(=>\s*\{|function\b[^{]*\{)/.exec(rest);
    if (fn) {
      let depth = 1;
      let j = i + fn[0].length;
      while (depth && j < block.length) {
        if (block[j] === '{') depth++;
        else if (block[j] === '}') depth--;
        j++;
      }
      i = j;
      continue;
    }
    out += block[i];
    i++;
  }
  return out;
}

function cachedReads(file: string): string[] {
  const code =
    transformSync(readFileSync(file, 'utf8'), {
      filename: file,
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
      plugins: [['babel-plugin-react-compiler', {}], '@babel/plugin-syntax-jsx'],
    })?.code ?? '';
  const hits: string[] = [];
  const re = /if \(\$\[\d+\] === Symbol\.for\("react\.memo_cache_sentinel"\)\) \{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 1;
    let i = m.index + m[0].length;
    while (depth && i < code.length) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
      i++;
    }
    const block = withoutFunctionBodies(code.slice(m.index + m[0].length, i - 1));
    const hit = block.match(SUSPECT);
    if (hit) hits.push(hit[0]);
  }
  return hits;
}

describe('React Compiler', () => {
  test('no changing module state is read once and cached during render', () => {
    const found = ['src/app', 'src/components', 'src/features']
      .flatMap((d) => files(join(ROOT, d)))
      .flatMap((f) => cachedReads(f).map((h) => `${relative(ROOT, f)}: ${h}`));
    expect(found).toEqual([]);
  }, 60_000);
});
