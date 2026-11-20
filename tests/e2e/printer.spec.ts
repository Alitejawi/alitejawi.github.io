import { expect, test, type Page } from '@playwright/test';

// The Daily Diff prints its brief on a thermal printer, so its case study prints its receipt
// figure too: the first time the printer scrolls into view, the receipt rises out of it in small
// jumps, header first, as paper comes out of a real one. It plays once. Nothing around it moves,
// and with reduced motion, without JavaScript, or when it is already on screen, it is just there.

const path = '/projects/daily-diff/';
const paper = (page: Page) => page.locator('[data-printer-paper]');
const printer = (page: Page) => page.locator('[data-printer]');

/** How far the paper sits from its resting place, in pixels: positive is still inside the printer. */
const offset = (page: Page) =>
  paper(page).evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);

/** The running animations on the paper, with their timing. */
const animations = (page: Page) =>
  paper(page).evaluate((element) => element.getAnimations().map((animation) => {
    const timing = animation.effect!.getTiming();
    return { easing: timing.easing, duration: Number(timing.duration) };
  }));

/** Where the figure's caption sits in the page, so a shift of anything around the printer shows. */
const captionTop = (page: Page) =>
  page.locator('figcaption', { hasText: 'Three weeks of briefs' })
    .evaluate((caption) => caption.getBoundingClientRect().top + window.scrollY);

test.describe('the Daily Diff receipt printer', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('is drawn as a decoration that screen readers skip', async ({ page }) => {
    await page.goto(path);
    await expect(printer(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('region', { name: 'The Daily Diff' })).toContainText('Briefs sent');
  });

  test('prints the receipt in small jumps when it scrolls into view, then leaves it at rest', async ({ page }) => {
    await page.goto(path);
    // Below the fold, the paper waits inside the printer.
    expect(await offset(page)).toBeGreaterThan(100);
    const before = await captionTop(page);

    await printer(page).scrollIntoViewIfNeeded();
    await expect.poll(() => animations(page).then((running) => running.length)).toBe(1);
    const [print] = await animations(page);
    expect(print.easing).toMatch(/^steps\(\d+/);
    expect(print.duration).toBeGreaterThanOrEqual(700);
    expect(print.duration).toBeLessThanOrEqual(1600);
    expect(await captionTop(page)).toBe(before);

    await paper(page).evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    expect(await offset(page)).toBe(0);
    expect(await captionTop(page)).toBe(before);
  });

  test('prints once: scrolling away and back leaves the receipt where it is', async ({ page }) => {
    await page.goto(path);
    await printer(page).scrollIntoViewIfNeeded();
    await expect.poll(() => animations(page).then((running) => running.length)).toBe(1);
    await paper(page).evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));

    await page.evaluate(() => window.scrollTo(0, 0));
    await printer(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await animations(page)).toEqual([]);
    expect(await offset(page)).toBe(0);
  });

  test('with reduced motion the receipt is already out and nothing moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    expect(await offset(page)).toBe(0);

    await printer(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await animations(page)).toEqual([]);
    expect(await offset(page)).toBe(0);
  });

  test('a receipt already on screen when the page opens is not taken back in', async ({ page }) => {
    // A window tall enough to show the figure without scrolling.
    await page.setViewportSize({ width: 1280, height: 4000 });
    await page.goto(path);
    await page.waitForTimeout(300);

    expect(await animations(page)).toEqual([]);
    expect(await offset(page)).toBe(0);
  });
});

test.describe('the Daily Diff receipt printer without JavaScript', () => {
  test.use({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });

  test('shows the printed receipt', async ({ page }) => {
    await page.goto(path);
    expect(await offset(page)).toBe(0);
    await expect(printer(page)).toBeAttached();
  });
});
