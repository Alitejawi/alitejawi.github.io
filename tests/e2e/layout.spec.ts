import { expect, test } from '@playwright/test';

const pages = [
  '/',
  '/writing/',
  '/posts/Add_gmail_delegate_silently/',
  '/posts/three-gam-commands-every-monday/',
  '/posts/Welcome/',
  '/projects/',
  '/projects/brain/',
  '/projects/daily-diff/',
  '/about/',
  '/now/',
];

// Remove each entry as its page lands in Task 8. Existing routes must stay built.
const pendingPages = new Set([
  '/about/',
  '/now/',
]);

test.use({ viewport: { width: 375, height: 812 } });

for (const path of pages) {
  test.describe(path, () => {
    test('no horizontal overflow at 375px', async ({ page }) => {
      const response = await page.goto(path);
      test.skip(response?.status() === 404 && pendingPages.has(path), 'Page is not built yet');
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
