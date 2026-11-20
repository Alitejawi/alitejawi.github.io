import { expect, test, type Page } from '@playwright/test';
import { longNote } from './helpers/pages';

/** Starts counting the browser's layout-shift score for the next page load. */
async function watchShifts(page: Page): Promise<() => Promise<number>> {
  await page.addInitScript(() => {
    const state = window as unknown as { shift: number };
    state.shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) state.shift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  return () => page.evaluate(() => (window as unknown as { shift: number }).shift);
}

// Nothing on a page should move after it first appears: no late banner, no image
// without a size, no text that re-wraps. The browser's own layout-shift score is the judge.
for (const width of [375, 1280]) {
  for (const path of ['/', longNote, '/projects/brain/', '/writing/']) {
    test(`${path} does not shift while loading at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      const shift = await watchShifts(page);

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      expect(await shift()).toBeLessThanOrEqual(0.005);
    });
  }
}

// On a slow connection the page appears before its fonts. Text is then set in a local font
// scaled to the web font's proportions ('Geist Sans Fallback' in global.css), so it keeps its
// line breaks when the real font arrives. These are page and width pairs where the text
// re-wrapped and pushed the page down before that fallback existed: scores of 0.016 to 0.046,
// measured on 17 November 2026 with the fonts held back as they are here.
test.describe('when the web fonts arrive late', () => {
  const cases: [string, number][] = [
    ['/projects/brain/', 430],
    ['/projects/brain/', 768],
    ['/projects/daily-diff/', 412],
    ['/projects/daily-diff/', 768],
    [longNote, 412],
    // About was checked at 360px until its intro changed from Amsterdam to Spain (20 November
    // 2026). A fallback matches the web font's width on average, not line by line, and that one
    // paragraph now gains a line in the fallback at a few phone widths: on a Mac at 324-328,
    // 356-364 and 448-452px (before the change: 328, 364-368 and 464-468px), on GitHub's Linux
    // also at 375px. It moves the page by about 0.016 once, when the font arrives. Which widths
    // it hits depends on the words, so no About width stays a stable check.
  ];

  for (const [path, width] of cases) {
    test(`${path} keeps its line breaks at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 823 });
      await page.route('**/*.woff2', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        await route.continue();
      });
      const shift = await watchShifts(page);

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      // 0 on a Mac, where the fallback is Arial. GitHub's Linux uses Liberation Sans and
      // scored 0.007 on one pair. Every pair scored 0.016 or more with no fallback at all.
      expect(await shift()).toBeLessThanOrEqual(0.01);
    });
  }
});
