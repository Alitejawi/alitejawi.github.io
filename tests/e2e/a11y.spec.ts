import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { longNote, pages } from './helpers/pages';

// Sections fade in on scroll; mid-fade text fails the contrast check for a moment.
// Reduced motion shows every section at full strength, which is the state to judge.
test.use({ reducedMotion: 'reduce' });

async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();

  return results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`);
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  test.describe(`${viewport.width}px wide`, () => {
    test.use({ viewport });

    for (const path of [...pages, '/404.html']) {
      test(`${path} has no accessibility violations`, async ({ page }) => {
        await page.goto(path);

        expect(await violations(page)).toEqual([]);
      });
    }
  });
}

test('the open README note has no accessibility violations', async ({ page }) => {
  await page.goto('/about/');
  await page.locator('[data-readme-open]').click();
  await expect(page.locator('dialog[data-readme]')).toBeVisible();

  expect(await violations(page)).toEqual([]);
});

test('the open contents list on a phone has no accessibility violations', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(longNote);
  await page.locator('.contents-mobile summary').click();

  expect(await violations(page)).toEqual([]);
});
