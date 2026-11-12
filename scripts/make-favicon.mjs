// Draws the site icon (a small smiling receipt) and writes every file browsers ask for:
//   public/assets/img/favicons/favicon.svg, favicon.ico (16, 32, 48) and apple-touch-icon.png (180).
// Run: node scripts/make-favicon.mjs
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const INK = '#232323';
const PAPER = '#f1eee7';
const ACCENT = '#ff9100';

// 16 x 16 pixels. '#' paper, 'k' ink, 'o' accent, '.' background.
const ART = [
  '................',
  '................',
  '....########....',
  '....########....',
  '....##k##k##....',
  '....##k##k##....',
  '....########....',
  '....#k####k#....',
  '....##kkkk##....',
  '....########....',
  '....#oooooo#....',
  '....########....',
  '....########....',
  '....#.#.#.#.....',
  '................',
  '................',
];
const COLORS = { '#': PAPER, k: INK, o: ACCENT };

const pixels = ART.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (COLORS[cell] ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[cell]}"/>`] : [])),
).join('');

/** The icon as SVG. `rounded` gives the tab icon its rounded corners; touch icons are full squares. */
function svg({ rounded }) {
  const background = `<rect width="16" height="16"${rounded ? ' rx="3"' : ''} fill="${INK}" shape-rendering="auto"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${background}${pixels}</svg>\n`;
}

/** An .ico file that holds PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const out = (name) => fileURLToPath(new URL(`../public/assets/img/favicons/${name}`, import.meta.url));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const render = async (markup, size, transparent) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:${transparent ? 'transparent' : INK}}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
    return page.screenshot({ type: 'png', omitBackground: transparent });
  };

  writeFileSync(out('favicon.svg'), svg({ rounded: true }));

  const sizes = [16, 32, 48];
  const pngs = [];
  for (const size of sizes) pngs.push({ size, png: await render(svg({ rounded: true }), size, true) });
  writeFileSync(out('favicon.ico'), ico(pngs));

  // 176 = 11 x 16, so every art pixel is exactly 11 screen pixels; the 2px ink border fills 180.
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<style>html,body{margin:0;background:${INK}}svg{display:block;width:176px;height:176px;margin:2px}</style>${svg({ rounded: false })}`);
  writeFileSync(out('apple-touch-icon.png'), await page.screenshot({ type: 'png' }));

  console.log('wrote favicon.svg, favicon.ico (16, 32, 48) and apple-touch-icon.png');
} finally {
  await browser.close();
}
