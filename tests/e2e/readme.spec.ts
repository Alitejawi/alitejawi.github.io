import { expect, test, type Page } from '@playwright/test';

const button = (page: Page) => page.locator('[data-readme-open]');
const note = (page: Page) => page.locator('dialog[data-readme]');

/** Opens the note and waits for its opening transition to end, so measurements see the resting panel. */
async function openNote(page: Page) {
  await button(page).click();
  await expect(note(page)).toBeVisible();
  await note(page).evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
}

async function overflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

test.describe('README note on a desktop screen', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the button opens the note and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await expect(note(page)).toBeHidden();

    await button(page).click();
    await expect(note(page)).toBeVisible();
    await expect(note(page).getByRole('heading', { name: 'Readme / Ali Al-Itejawi' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(note(page)).toBeHidden();
    await expect(button(page)).toBeFocused();
  });

  test('the Close button closes it', async ({ page }) => {
    await page.goto('/projects/brain/');
    await button(page).click();
    await note(page).getByRole('button', { name: 'Close' }).click();
    await expect(note(page)).toBeHidden();
  });

  test('a click outside the note closes it', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await expect(note(page)).toBeVisible();
    await page.mouse.click(20, 20);
    await expect(note(page)).toBeHidden();
  });

  test('the note opens from the bottom right corner and fits the screen', async ({ page }) => {
    await page.goto('/');
    await openNote(page);
    const box = await note(page).evaluate((element) => {
      const { top, right, bottom, left } = element.getBoundingClientRect();
      return { top, right, bottom, left, origin: getComputedStyle(element).transformOrigin };
    });

    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(1280 - box.right).toBeLessThanOrEqual(24);
    expect(800 - box.bottom).toBeLessThanOrEqual(24);
    // The computed origin is in pixels: the far corner of the panel.
    expect(box.origin).toBe(`${box.right - box.left}px ${box.bottom - box.top}px`);
  });

  test('the contents list starts on the first section', async ({ page }) => {
    await page.goto('/');
    await openNote(page);

    await expect(note(page).getByRole('link', { name: '001 / Why I build things' })).toHaveAttribute('aria-current', 'location');
    await expect(note(page).getByRole('link', { name: '002 / How I work' })).not.toHaveAttribute('aria-current');
  });

  test('a contents link scrolls the note, not the page', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await note(page).getByRole('link', { name: '003 / Who am I' }).click();

    await expect(note(page).locator('#readme-who')).toBeInViewport();
    await expect(note(page).getByRole('link', { name: '003 / Who am I' })).toHaveAttribute('aria-current', 'location');
    expect(new URL(page.url()).hash).toBe('');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('the note animates open, and not at all with reduced motion', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    expect(await note(page).evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await button(page).click();
    await expect(note(page)).toBeVisible();
    expect(await note(page).evaluate((element) => element.getAnimations().length)).toBe(0);
    await expect(note(page)).toHaveCSS('opacity', '1');
  });
});

test.describe('README note on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the open note fills the screen without sideways scrolling', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await openNote(page);

    const box = await note(page).boundingBox();
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(375);
    const { scrollWidth, innerWidth } = await overflow(page);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const inner = await note(page).locator('[data-readme-body]').evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth);
  });

  test('the last section and the contact links can be reached by scrolling', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    const email = note(page).getByRole('link', { name: 'ali@itejawi.com' });
    await email.scrollIntoViewIfNeeded();
    await expect(email).toBeInViewport();
  });
});

for (const width of [375, 1024, 1280]) {
  test(`at the end of the page the README button does not cover the footer links (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const open = await button(page).boundingBox();
    expect(open).not.toBeNull();
    for (const link of await page.locator('footer.site-footer a').all()) {
      const box = await link.boundingBox();
      const apart = box!.x + box!.width <= open!.x || box!.x >= open!.x + open!.width
        || box!.y + box!.height <= open!.y || box!.y >= open!.y + open!.height;
      expect(apart, `footer link "${await link.textContent()}" is under the README button`).toBe(true);
    }
  });
}
