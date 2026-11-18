import { expect, test } from '@playwright/test';
import { longNote } from './helpers/pages';

test.use({ viewport: { width: 1280, height: 900 } });

test('a printed field note is the article and nothing else', async ({ page }) => {
  await page.goto(longNote);
  await expect(page.locator('.code-bar').first()).toBeVisible();
  await page.emulateMedia({ media: 'print' });

  for (const chrome of ['.nav-shell', '[data-readme-open]', '.contents', '.code-bar', '.article-pagination', '.site-footer .links']) {
    await expect(page.locator(chrome).first(), `${chrome} is left out`).toBeHidden();
  }
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.article-body pre').first()).toBeVisible();
  // Code prints dark on white: no dark panel, no pale syntax colours.
  const code = await page.locator('.article-body pre').first().evaluate((pre) => {
    const token = pre.querySelector('span span') ?? pre;
    return { panel: getComputedStyle(pre).backgroundColor, text: getComputedStyle(token).color };
  });
  expect(code.panel).toBe('rgb(255, 255, 255)');
  expect(code.text).toBe('rgb(35, 35, 35)');
});

test('a printed homepage shows the sections below the fold', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  // On screen these fade in when scrolled to; paper cannot scroll.
  for (const section of await page.locator('[data-fade]').all()) {
    await expect(section).toHaveCSS('opacity', '1');
  }
});
