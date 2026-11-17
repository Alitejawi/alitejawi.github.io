import { expect, test } from '@playwright/test';
import { longNote } from './helpers/pages';

test.use({ viewport: { width: 1280, height: 900 } });

test('the contents list marks the section being read', async ({ page }) => {
  await page.goto(longNote);
  const current = page.locator('.contents-desktop a[aria-current="location"]');
  const headings = page.locator('.article-body > h2');
  const count = await headings.count();

  await expect(current).toHaveCount(1);
  await expect(current).toContainText(await headings.first().innerText());

  // Halfway down: the fourth section's heading is at the top of the window.
  await headings.nth(3).evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
  await expect(current).toContainText(await headings.nth(3).innerText());

  // The last section is short and never reaches the top; the end of the page counts.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(current).toContainText(await headings.nth(count - 1).innerText());

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(current).toContainText(await headings.first().innerText());
});

test('a contents link jumps to its section', async ({ page }) => {
  await page.goto(longNote);
  const third = page.locator('.contents-desktop nav a').nth(2);
  const target = (await third.getAttribute('href'))!;

  await third.click();

  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(page.locator(target)).toBeInViewport();
});
