import { expect, test, type Page } from '@playwright/test';
import { sidewaysOverflow } from './helpers/overflow';
import { pages } from './helpers/pages';

const button = (page: Page) => page.locator('[data-readme-open]');
const note = (page: Page) => page.locator('dialog[data-readme]');

/** Opens the note and waits for its opening transition to end, so measurements see the resting panel. */
async function openNote(page: Page) {
  await button(page).click();
  await expect(note(page)).toBeVisible();
  await note(page).evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
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
      // The page's own width: the window less the scrollbar that Windows and Linux draw beside it.
      const pageWidth = document.documentElement.getBoundingClientRect().width;
      return { top, right, bottom, left, pageWidth, origin: getComputedStyle(element).transformOrigin };
    });

    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect([1280, 1265]).toContain(box.pageWidth);
    expect(box.pageWidth - box.right).toBeLessThanOrEqual(24);
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
    // The page's own width: the window less the scrollbar that Windows and Linux draw beside it.
    const pageWidth = await page.evaluate(() => document.documentElement.getBoundingClientRect().width);
    expect([375, 360]).toContain(pageWidth);
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(pageWidth);
    expect(await sidewaysOverflow(page)).toBe(0);
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

    // Back in its corner at the end, where the footer leaves room for it.
    await expect(button(page)).toBeInViewport({ ratio: 1 });
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

/** Scrolls the window by `by` pixels and waits until the page has handled the scroll. */
async function scroll(page: Page, by: number) {
  await page.evaluate((by) => new Promise((resolve) => {
    addEventListener('scroll', resolve, { once: true });
    scrollBy({ top: by, behavior: 'instant' });
  }), by);
}

/** The words in the page that the README button hides from view, once it has come to rest. */
function coveredWords(page: Page) {
  return page.evaluate(() => {
    const open = document.querySelector<HTMLElement>('[data-readme-open]')!;
    open.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
    if (getComputedStyle(open).opacity === '0') return [];
    // The label and the + square: the space beside the square is see-through.
    const parts = [...open.children].map((part) => part.getBoundingClientRect())
      .filter((box) => box.bottom > 0 && box.top < innerHeight);
    const words: string[] = [];
    for (const root of document.querySelectorAll('main, footer')) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        if (getComputedStyle(node.parentElement!).visibility === 'hidden') continue;
        for (const match of node.data.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const under = [...range.getClientRects()].some((line) => parts.some((box) =>
            line.right > box.left && line.left < box.right && line.bottom > box.top && line.top < box.bottom));
          if (under) words.push(match[0]);
        }
      }
    }
    return words;
  });
}

// Below 1240px the button sits over the text column. It moves out of the way while the reader
// scrolls down and comes back when they scroll up, or at the end, where the footer leaves room.
test.describe('README button over the text', () => {
  for (const width of [375, 1024]) {
    for (const path of pages) {
      test(`${path} at ${width}px: scrolling down, the button covers no text`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

        // At the top the button is in its corner, where a visitor sees it first.
        for (let y = 0; y < end; y += 300) {
          await scroll(page, 300);
          const top = await page.evaluate(() => Math.round(scrollY));
          expect(await coveredWords(page), `scrolled to ${top}px`).toEqual([]);
        }
      });
    }
  }

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('scrolling back up brings the button back, ready to open the note', async ({ page }) => {
      await page.goto('/projects/brain/');
      await scroll(page, 900);
      await expect(button(page)).not.toBeInViewport();

      await scroll(page, -100);
      await expect(button(page)).toBeInViewport({ ratio: 1 });
      await button(page).click();
      await expect(note(page)).toBeVisible();
    });

    test('the keyboard still reaches the button while it is out of the way', async ({ page }) => {
      await page.goto('/projects/brain/');
      await scroll(page, 900);
      await expect(button(page)).not.toBeInViewport();

      // The button is the last thing on the page that takes focus.
      await page.keyboard.press('Shift+Tab');
      await expect(button(page)).toBeFocused();
      await expect(button(page)).toBeInViewport({ ratio: 1 });
    });

    test('with reduced motion the button moves away without animating', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/projects/brain/');
      await scroll(page, 900);

      expect(await button(page).evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
      await expect(button(page)).not.toBeInViewport();
    });
  });

  test('on a wide screen, where it covers nothing, the button stays in its corner', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/projects/brain/');
    await scroll(page, 900);
    await page.waitForTimeout(300);

    await expect(button(page)).toBeInViewport({ ratio: 1 });
  });
});
