import { expect, test, type Page } from '@playwright/test';

const playState = (page: Page) =>
  page.locator('[data-ticker-track]').evaluate((track) => getComputedStyle(track).animationPlayState);

test('the ticker can be paused and restarted from the keyboard', async ({ page }) => {
  await page.goto('/');
  const pause = page.getByRole('button', { name: 'Pause the status ticker' });

  expect(await playState(page)).toBe('running');
  await pause.focus();
  await expect(pause).toBeVisible();
  await page.keyboard.press('Enter');

  expect(await playState(page)).toBe('paused');
  const play = page.getByRole('button', { name: 'Play the status ticker' });
  await expect(play).toBeFocused();
  await page.keyboard.press('Enter');

  expect(await playState(page)).toBe('running');
});

test('tapping the ticker pauses it, and it stays paused on the next page', async ({ page }) => {
  await page.goto('/');

  await page.locator('[data-ticker]').click();
  expect(await playState(page)).toBe('paused');

  await page.goto('/about/');
  await expect(page.getByRole('button', { name: 'Play the status ticker' })).toBeAttached();
  expect(await playState(page)).toBe('paused');
});

test('the ticker is a labelled group, readable by a screen reader', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('group', { name: 'Status updates' })).toContainText('Spain');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the ticker does not move, so it offers no pause button', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: /status ticker/ })).toHaveCount(0);
  });
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a second tap restarts the ticker', async ({ page }) => {
    await page.goto('/');
    const ticker = page.locator('[data-ticker]');

    await ticker.tap();
    expect(await playState(page)).toBe('paused');
    // A touch screen has no pointer to move away, so nothing but the tap may hold it paused.
    await ticker.tap();
    expect(await playState(page)).toBe('running');
  });
});
