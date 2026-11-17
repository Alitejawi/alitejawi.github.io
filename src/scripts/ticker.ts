// Pause and restart the scrolling ticker. Moving text needs a way to stop it that works
// without a mouse (WCAG 2.2.2): a click or tap anywhere on the strip toggles it, and a
// button that appears on keyboard focus does the same. The choice lasts for the visit.
const KEY = 'ticker-paused';
const ticker = document.querySelector<HTMLElement>('[data-ticker]');
const toggle = ticker?.querySelector<HTMLButtonElement>('[data-ticker-toggle]');
const action = toggle?.querySelector<HTMLElement>('[data-ticker-action]');

function remembered(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function setPaused(paused: boolean): void {
  if (!ticker || !action) return;
  ticker.toggleAttribute('data-paused', paused);
  action.textContent = paused ? 'Play' : 'Pause';
  try {
    if (paused) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked; the ticker still pauses for this page.
  }
}

if (ticker && toggle) {
  toggle.hidden = false;
  setPaused(remembered());
  // The button sits inside the strip, so its click (or Enter, or Space) lands here too.
  ticker.addEventListener('click', () => setPaused(!ticker.hasAttribute('data-paused')));
}
