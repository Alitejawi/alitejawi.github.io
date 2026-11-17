import { expect, test } from '@playwright/test';
import { longNote } from './helpers/pages';

for (const width of [375, 1280]) {
  test(`at ${width}px, only code blocks that scroll are keyboard stops`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(longNote);
    await expect(page.locator('.code-block').first()).toBeVisible();

    const blocks = await page.locator('.article-body pre').evaluateAll((pres) =>
      pres.map((pre) => ({
        scrolls: pre.scrollWidth > pre.clientWidth,
        stop: pre.getAttribute('tabindex') === '0',
        role: pre.getAttribute('role'),
        label: pre.getAttribute('aria-label'),
      })),
    );

    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.stop).toBe(block.scrolls);
      // A label is only allowed on an element with a role; a bare <pre> has none.
      expect(block.role).toBe(block.scrolls ? 'group' : null);
      expect(Boolean(block.label)).toBe(block.scrolls);
    }
  });
}

test('a code block that scrolls on a phone can be scrolled with the arrow keys', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(longNote);
  const wide = page.locator('.article-body pre[tabindex="0"]').first();

  await wide.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  await expect.poll(() => wide.evaluate((pre) => pre.scrollLeft)).toBeGreaterThan(0);
});
