/**
 * Lists interface strings used with tx() that have no Urdu entry in
 * src/i18n/ur.ts, plus turn-by-turn/voice phrases passed to helpers.
 * Run: node scripts/check-translations.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const root = path.join(__dirname, '..');
const files = execSync("grep -rl \"from '@/lib/i18n'\" src", { cwd: root }).toString().trim().split('\n');
const used = new Set();
// tx('…'), speak('…'), t('…') inside describeStep/spokenInstruction, pick('…','…')
const CALLEES = new Set(['tx', 'txEn', 'speak', 't', 'pick', 'voice']);
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const ast = parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  traverse(ast, {
    CallExpression(p) {
      const name = p.node.callee.type === 'Identifier' ? p.node.callee.name : null;
      if (!name || !CALLEES.has(name)) return;
      for (const a of p.node.arguments) {
        if (a.type === 'StringLiteral' && /[A-Za-z]/.test(a.value)) used.add(a.value);
        if (a.type === 'ConditionalExpression') {
          for (const b of [a.consequent, a.alternate]) if (b.type === 'StringLiteral') used.add(b.value);
        }
      }
    },
  });
}
const urSrc = fs.readFileSync(path.join(root, 'src/i18n/ur.ts'), 'utf8');
const ast = parser.parse(urSrc, { sourceType: 'module', plugins: ['typescript'] });
const have = new Set();
traverse(ast, { ObjectProperty(p) { if (p.node.key.type === 'StringLiteral') have.add(p.node.key.value); } });
// Code values passed to pick helpers, not interface text.
const IGNORE = new Set(['camera', 'library']);
const missing = [...used].filter((k) => !have.has(k) && !IGNORE.has(k)).sort();
const unused = [...have].filter((k) => !used.has(k)).sort();
console.log(`${used.size} strings in code, ${have.size} Urdu entries, ${missing.length} missing, ${unused.length} unused`);
for (const k of missing) console.log('MISSING:', JSON.stringify(k));
if (process.argv.includes('--unused')) for (const k of unused) console.log('UNUSED:', JSON.stringify(k));
process.exitCode = missing.length ? 1 : 0;
