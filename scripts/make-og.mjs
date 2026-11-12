// Renders the link-preview image that LinkedIn, Slack and others show for the site.
// Output: public/assets/img/og.png (1200 x 630). Run: node scripts/make-og.mjs
// The name, role and headline are read from src/data/site.ts, so rerun this after changing them.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const siteSource = read('src/data/site.ts').toString();

function field(name) {
  // Match the value in the object literal (`name: '...',`), not the type declaration.
  const match = siteSource.match(new RegExp(`^\\s*${name}: '((?:[^'\\\\]|\\\\.)*)',`, 'm'));
  if (!match) throw new Error(`make-og: could not read "${name}" from src/data/site.ts`);
  return match[1].replace(/\\'/g, "'");
}

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const font = (pkg, file) => read(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64');
const name = escapeHtml(field('name'));
const role = escapeHtml(field('role'));
const headline = escapeHtml(field('headline'));
const host = new URL(field('url')).host;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; font-weight: 400; src: url(data:font/woff2;base64,${font('geist-sans', 'geist-sans-latin-400-normal.woff2')}) format('woff2'); }
@font-face { font-family: Geist; font-weight: 500; src: url(data:font/woff2;base64,${font('geist-sans', 'geist-sans-latin-500-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Geist Mono'; font-weight: 400; src: url(data:font/woff2;base64,${font('geist-mono', 'geist-mono-latin-400-normal.woff2')}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #f1eee7; color: #232323; font-family: Geist, sans-serif; padding: 64px 72px; display: grid; grid-template-columns: 1fr 380px; column-gap: 64px; grid-template-rows: auto 1fr auto; }
.mono { font-family: 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: 0.02em; }
.top { grid-column: 1 / -1; display: flex; align-items: center; gap: 18px; font-size: 20px; color: #5b5a56; }
.logo { width: 44px; height: 44px; border-radius: 6px; background: #232323 repeating-linear-gradient(135deg, #f1eee7 0 2px, transparent 2px 6px); }
h1 { align-self: center; font-size: 84px; font-weight: 500; line-height: 1.04; letter-spacing: -0.03em; }
.receipt { align-self: center; border: 2px dashed #9a978f; font-size: 17px; }
.receipt .head { display: flex; justify-content: space-between; padding: 18px 20px; border-bottom: 2px dashed #9a978f; }
.receipt .head span:last-child { color: #5b5a56; }
.receipt .body { padding: 18px 20px 20px; }
.line { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.line i { flex: 1; border-bottom: 2px dotted #9a978f; transform: translateY(-4px); }
.receipt .end { margin-top: 20px; color: #5b5a56; }
.foot { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; font-size: 20px; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #ff9100; }
</style></head>
<body>
  <div class="top mono"><div class="logo"></div><span>${name} · ${role}</span></div>
  <h1>${headline}</h1>
  <div class="receipt mono">
    <div class="head"><span>Field notes &amp; work</span><span>${host}</span></div>
    <div class="body">
      <div class="line"><span>Brain</span><i></i><span>AI knowledge base</span></div>
      <div class="line"><span>The Daily Diff</span><i></i><span>Morning brief</span></div>
      <div class="line"><span>Field notes</span><i></i><span>Security · IT</span></div>
      <div class="end">Thank you for reading</div>
    </div>
  </div>
  <div class="foot mono"><div class="dot"></div><span>${host}</span></div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const output = fileURLToPath(new URL('public/assets/img/og.png', root));
  await page.screenshot({ path: output, type: 'png' });
  console.log(`wrote ${output}`);
} finally {
  await browser.close();
}
