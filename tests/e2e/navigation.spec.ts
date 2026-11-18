import { expect, test } from '@playwright/test';

test('hovering a link fetches its page before the click', async ({ page }) => {
  await page.goto('/');
  const fetched = page.waitForRequest((request) => new URL(request.url()).pathname === '/about/', { timeout: 5000 });

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).hover();

  expect((await fetched).resourceType()).not.toBe('document');
});

test('a visitor who asked to save data gets no early fetches', async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true });
  });
  await page.goto('/');
  const early: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/about/') early.push(request.url());
  });

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).hover();
  await page.waitForTimeout(600);

  expect(early).toEqual([]);
  await context.close();
});
