import { expect, test } from '@playwright/test';
import { longNote } from './helpers/pages';

// Nothing on a page should move after it first appears: no late banner, no image
// without a size, no text that re-wraps. The browser's own layout-shift score is the judge.
for (const width of [375, 1280]) {
  for (const path of ['/', longNote, '/projects/brain/', '/writing/']) {
    test(`${path} does not shift while loading at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.addInitScript(() => {
        const state = window as unknown as { shift: number };
        state.shift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) state.shift += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBeLessThanOrEqual(0.005);
    });
  }
}
