/**
 * Builds the small website behind GoTourGo SOS and live-location links
 * (https://go-tour-go-development.expo.app) into site-dist/, ready for EAS Hosting:
 *
 *   node scripts/build-share-site.mjs
 *   bunx eas-cli deploy --export-dir site-dist --prod
 *
 * - /sos?t=… and /live?t=… show the shared location when the app isn't installed.
 * - /p?id=… shows a shared community post (posts by public profiles only) with
 *   an "Open in GoTourGo" button (custom-scheme intent, no App Link needed).
 * - /.well-known/assetlinks.json lets Android open those links straight in the app
 *   (App Links), so it must list the APK's signing certificate.
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (client-safe
 * values) from the environment or .env.local. GOTOURGO_INSTALL_URL (optional) adds a
 * "Get the app" button, e.g. the expo.dev page of the latest APK build.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site');
const out = join(root, 'site-dist');

/** SHA-256 of the certificates that sign the app (eas credentials -p android). */
const ANDROID_CERT_SHA256 = ['79:7B:FB:FB:5E:D5:6E:A1:AF:8B:D5:8D:8B:76:7A:78:A6:7A:1B:CA:E7:8E:09:90:4B:8A:25:4E:11:FD:89:3B'];

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = { ...readEnvFile(join(root, '.env.local')), ...process.env };
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or add them to .env.local).');
  process.exit(1);
}
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const androidPackage = appJson.android.package;
const appScheme = Array.isArray(appJson.scheme) ? appJson.scheme[0] : appJson.scheme;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// The output folder ignores itself, so it is never committed by accident.
writeFileSync(join(out, '.gitignore'), '*\n');
cpSync(src, out, { recursive: true });

// One page serves both link kinds; both URL shapes resolve on static hosting.
const share = readFileSync(join(src, 'share.html'), 'utf8');
for (const kind of ['sos', 'live']) {
  writeFileSync(join(out, `${kind}.html`), share);
  mkdirSync(join(out, kind), { recursive: true });
  writeFileSync(join(out, kind, 'index.html'), share);
}
rmSync(join(out, 'share.html'));

// Shared posts: /p?id=… (and /p/?id=…).
const post = readFileSync(join(src, 'post.html'), 'utf8');
writeFileSync(join(out, 'p.html'), post);
mkdirSync(join(out, 'p'), { recursive: true });
writeFileSync(join(out, 'p', 'index.html'), post);
rmSync(join(out, 'post.html'));

writeFileSync(
  join(out, 'config.js'),
  `window.GOTOURGO = ${JSON.stringify({ supabaseUrl, supabaseKey, androidPackage, appScheme, installUrl: env.GOTOURGO_INSTALL_URL || '' }, null, 2)};\n`,
);

mkdirSync(join(out, '.well-known'), { recursive: true });
writeFileSync(
  join(out, '.well-known', 'assetlinks.json'),
  JSON.stringify(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: androidPackage, sha256_cert_fingerprints: ANDROID_CERT_SHA256 },
      },
    ],
    null,
    2,
  ) + '\n',
);

console.log(`Built ${out} for ${androidPackage}.`);
console.log('Deploy with: bunx eas-cli deploy --export-dir site-dist --prod');
