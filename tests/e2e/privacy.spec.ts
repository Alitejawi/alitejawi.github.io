import { expect, test } from '@playwright/test';
import { site } from '../../src/data/site';
import { pages } from './helpers/pages';

// Hosts a page may contact besides the site itself. Empty unless analytics is switched on.
const allowed: string[] = [];

for (const path of pages) {
  test(`${path} contacts no other site`, async ({ page, baseURL }) => {
    const hosts = new Set<string>();
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && url.origin !== new URL(baseURL!).origin) hosts.add(url.host);
    });

    await page.goto(path, { waitUntil: 'networkidle' });

    expect([...hosts].filter((host) => !allowed.includes(host))).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(site.url).toBe('https://itejawi.com');
  });
}
