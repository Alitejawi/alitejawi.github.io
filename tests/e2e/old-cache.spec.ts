import { readFile, stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Until 12 November 2026 this site ran on Jekyll with the Chirpy theme. Its
// service worker (/sw.min.js) answers from its own cache and never asks the
// network again, so a browser that visited back then keeps showing the old
// homepage. tests/fixtures/old-site holds that worker as the theme shipped it.
const oldSite = fileURLToPath(new URL('../fixtures/old-site/', import.meta.url));
const newSite = fileURLToPath(new URL('../../dist/', import.meta.url));

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

let root = oldSite;
let server: Server;
let origin: string;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname));
    let file = join(root, path);

    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('a browser that still holds the old Jekyll cache ends up on the new site', async ({ page }) => {
  // Before the move: the old site is live and its worker takes over the page.
  root = oldSite;
  await page.goto(`${origin}/`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.min.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page).toHaveTitle('Old Jekyll homepage');
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // After the move: the same address now serves the new site.
  root = newSite;
  await page.goto(`${origin}/`);

  await expect(page).toHaveTitle(/Principal Systems Engineer/, { timeout: 15_000 });
  await expect(page.locator('body')).toContainText('Espressos consumed');
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
    .toBe(0);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).length)).toBe(0);
});
