import { expect, test } from '@playwright/test';
import { sidewaysOverflow } from './helpers/overflow';
import { pages } from './helpers/pages';

test.use({ viewport: { width: 375, height: 812 } });

for (const path of pages) {
  test.describe(path, () => {
    test('no horizontal overflow at 375px', async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      expect(await sidewaysOverflow(page)).toBe(0);
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

  expect(await sidewaysOverflow(page)).toBe(0);
});

test('the overflow check notices content only a few pixels too wide', async ({ page }) => {
  // The check's own check: 10px too wide still fits inside the window where a scrollbar is drawn.
  await page.goto('/about/');
  expect(await sidewaysOverflow(page)).toBe(0);

  await page.evaluate(() => {
    const bar = document.createElement('div');
    bar.style.cssText = `width: ${document.documentElement.getBoundingClientRect().width + 10}px; height: 1px;`;
    document.body.append(bar);
  });

  expect(await sidewaysOverflow(page)).toBe(10);
});
