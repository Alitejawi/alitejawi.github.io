import { expect, test, type Page } from '@playwright/test';
import { longNote } from './helpers/pages';

// The ASCII decode (ascii-reveal) runs in three places: the README note on every open, the
// espresso count on the first homepage view of a visit, and the not-found page. It never runs
// for visitors who ask for reduced motion, and it never leaves text hidden.

/** How many elements under `selector` hold text that is drawn transparent right now. */
const hiddenText = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((root) =>
    [root, ...root.querySelectorAll('*')].filter((element) =>
      [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim())
      && getComputedStyle(element).getPropertyValue('-webkit-text-fill-color') === 'rgba(0, 0, 0, 0)').length);

/** Waits until the text under `selector` has been hidden and then decoded back in. */
async function decodes(page: Page, selector: string) {
  await expect.poll(() => hiddenText(page, selector), { intervals: [20], timeout: 2_000 }).toBeGreaterThan(0);
  await expect.poll(() => hiddenText(page, selector), { timeout: 4_000 }).toBe(0);
}

/** Collects requests for the decode script. */
function decodeRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/_astro\/decode\.[^/]*\.js$/.test(new URL(request.url()).pathname)) requests.push(request.url());
  });
  return requests;
}

const readme = {
  button: (page: Page) => page.locator('[data-readme-open]'),
  body: '[data-readme-body]',
};

test.describe('the README note', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('decodes its text each time it opens, then leaves every line readable', async ({ page }) => {
    await page.goto('/about/');

    for (let round = 0; round < 2; round += 1) {
      await readme.button(page).click();
      await decodes(page, readme.body);
      await page.locator(readme.body).evaluate((body) => { body.scrollTop = body.scrollHeight; });
      expect(await hiddenText(page, readme.body)).toBe(0);
      await page.keyboard.press('Escape');
    }
  });

  test('keeps its text in the page for screen readers while it decodes', async ({ page }) => {
    await page.goto('/');
    await readme.button(page).click();

    await expect.poll(() => hiddenText(page, readme.body), { intervals: [20] }).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: '001 / Why I build things' })).toBeAttached();
    await expect(page.locator(readme.body)).toContainText('I like problems that stay solved');
  });

  test('an article loads the decode script only when the README button is approached', async ({ page }) => {
    const requests = decodeRequests(page);
    await page.goto(longNote, { waitUntil: 'networkidle' });
    expect(requests).toEqual([]);

    await readme.button(page).hover();
    await expect.poll(() => requests.length).toBe(1);
  });
});

test.describe('the espresso count', () => {
  const count = '.espresso-count';

  test('decodes on the first homepage view of a visit, and not when the visitor comes back', async ({ page }) => {
    await page.goto('/');
    await decodes(page, count);
    await expect(page.locator(count)).toHaveText(/^\d{1,3}(,\d{3})*$/);

    await page.goto('/about/');
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.dataset.decoding)).toBeUndefined();
    expect(await hiddenText(page, count)).toBe(0);
    await expect(page.locator(`${count} .ar-overlay`)).toHaveCount(0);
  });

  test('keeps its comma in place while the digits scramble', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => hiddenText(page, count), { intervals: [20] }).toBeGreaterThan(0);

    const comma = page.locator(`${count} [data-ascii="skip"]`).first();
    await expect(comma).toHaveText(',');
    expect(await comma.evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-text-fill-color')))
      .not.toBe('rgba(0, 0, 0, 0)');
  });

  test('still appears when no script can run', async ({ page }) => {
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('/');

    await expect.poll(() => hiddenText(page, count), { timeout: 5_000 }).toBe(0);
  });
});

test.describe('the not-found page', () => {
  const receipt = '.not-found';

  test('decodes on every visit, with the address the visitor asked for', async ({ page }) => {
    await page.goto('/no/such/page/');
    await decodes(page, receipt);
    await expect(page.locator('.asked .receipt-value')).toHaveText('/no/such/page/');

    await page.reload();
    await decodes(page, receipt);
  });

  test('has a field of drifting glyphs behind it, and no other page has one', async ({ page }) => {
    await page.goto('/no/such/page/');
    const field = page.locator('[data-glyph-field]');
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('aria-hidden', 'true');

    const frame = () => field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    const first = await frame();
    await expect.poll(frame, { timeout: 3_000 }).not.toBe(first);

    await page.goto('/');
    await expect(page.locator('[data-glyph-field]')).toHaveCount(0);
  });
});

test('the glyph field settles into a still picture after five seconds', async ({ page }) => {
  // WCAG 2.2.2: motion that starts by itself and runs beside content stops within five seconds,
  // or offers a pause button (as the ticker does).
  await page.goto('/no/such/page/');
  const field = page.locator('[data-glyph-field]');
  await page.waitForTimeout(5_300);

  const still = await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.waitForTimeout(700);
  expect(await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(still);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing decodes and the decode script never loads', async ({ page }) => {
    const requests = decodeRequests(page);

    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.dataset.decoding)).toBeUndefined();
    expect(await hiddenText(page, '.espresso-count')).toBe(0);

    await readme.button(page).click();
    await expect(page.locator(readme.body)).toBeVisible();
    expect(await hiddenText(page, readme.body)).toBe(0);
    await page.waitForTimeout(500);
    expect(await hiddenText(page, readme.body)).toBe(0);
    expect(requests).toEqual([]);
  });

  test('the not-found page shows its text at once, and the glyph field holds still', async ({ page }) => {
    await page.goto('/no/such/page/');
    expect(await hiddenText(page, '.not-found')).toBe(0);

    const field = page.locator('[data-glyph-field]');
    await expect(field).toBeVisible();
    const first = await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    await page.waitForTimeout(800);
    expect(await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(first);
  });
});
