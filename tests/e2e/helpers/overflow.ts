import type { Page } from '@playwright/test';

/**
 * How many pixels the content runs past the side of the page (0 means it fits).
 *
 * Measured against the page's own width, not the window's. Windows and Linux draw a 15px
 * scrollbar beside the page, so content up to 15px too wide still fits inside the window.
 */
export async function sidewaysOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - Math.round(root.getBoundingClientRect().width));
  });
}
