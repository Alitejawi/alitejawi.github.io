import { expect, test } from '@playwright/test';

const pages = [
  '/',
  '/writing/',
  '/posts/Add_gmail_delegate_silently/',
  '/posts/three-gam-commands-every-monday/',
  '/posts/delete-lock-for-ai-agents/',
  '/posts/claude-boss-codex-worker/',
  '/posts/Welcome/',
  '/projects/',
  '/projects/brain/',
  '/projects/daily-diff/',
  '/about/',
  '/now/',
];

test.use({ viewport: { width: 375, height: 812 } });

for (const path of pages) {
  test.describe(path, () => {
    test('no horizontal overflow at 375px', async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  });
}

test('reduced motion stops ticker and shows content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('[data-ticker-track]')).toHaveCSS('animation-name', 'none');
  for (const fade of await page.locator('[data-fade]').all()) {
    await expect(fade).toHaveCSS('opacity', '1');
  }
});

test('an unknown address shows the not-found receipt with that address', async ({ page }) => {
  const response = await page.goto('/no/such/page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText("This page isn't on the receipt.");
  await expect(page.locator('.asked .receipt-value')).toHaveText('/no/such/page/');
});

test('a very long unknown address does not overflow the not-found page', async ({ page }) => {
  await page.goto(`/${'x'.repeat(140)}/`);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.asked .receipt-value')).toContainText('…');

  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});
