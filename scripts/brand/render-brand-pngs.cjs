/**
 * Renders the brand SVGs in assets/brand/ to PNG with headless Chromium.
 * Run after scripts/brand/make-brand-svgs.py:
 *
 *   node scripts/brand/render-brand-pngs.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..', '..', 'assets', 'brand');

// [source svg, output png, width, height]
const JOBS = [
  ['icon.svg', 'icon.png', 1024, 1024],
  ['adaptive-foreground.svg', 'adaptive-foreground.png', 1024, 1024],
  ['adaptive-background.svg', 'adaptive-background.png', 1024, 1024],
  ['monochrome.svg', 'monochrome.png', 1024, 1024],
  ['splash-icon.svg', 'splash-icon.png', 1024, 1024],
  ['icon.svg', 'favicon.png', 48, 48],
  ['logo-symbol.svg', 'logo-symbol.png', 512, 700],
  ['wordmark-horizontal.svg', 'wordmark-horizontal.png', null, null],
  ['wordmark-stacked.svg', 'wordmark-stacked.png', null, null],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [src, out, w, h] of JOBS) {
    const svg = fs.readFileSync(path.join(dir, src), 'utf8');
    const natural = svg.match(/width="(\d+)" height="(\d+)"/);
    const width = w ?? Number(natural[1]);
    const height = h ?? Number(natural[2]);
    await page.setViewportSize({ width, height });
    const sized = svg.replace(/width="\d+" height="\d+"/, `width="${width}" height="${height}"`);
    await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
    await page.locator('svg').screenshot({ path: path.join(dir, out), omitBackground: true });
    console.log('rendered', path.join('assets/brand', out), `${width}x${height}`);
  }
  await browser.close();
})();
