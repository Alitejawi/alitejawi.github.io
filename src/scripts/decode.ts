// The ASCII decode: text scrambles through glyphs and lands in place (ascii-reveal, MIT).
// It runs on the README note, the espresso count and the not-found page; the pages decide
// when, and load this file only then. The text stays in the page the whole time, so screen
// readers and search engines read it as usual, and nothing here runs with reduced motion.
import { createAsciiReveal, type RunOptions } from 'ascii-reveal/core';

/** The names a page puts in <html data-decoding> to hide text before its first paint. */
export type Decoding = 'espresso' | 'notfound';

const root = document.documentElement;

/** Removes one name from <html data-decoding>, so its hiding rule stops applying. */
function release(name: Decoding) {
  const rest = (root.dataset.decoding ?? '').split(' ').filter((item) => item && item !== name);
  if (rest.length) root.dataset.decoding = rest.join(' ');
  else delete root.dataset.decoding;
}

/**
 * Decodes the text under `element` once. The page hid it before its first paint (see the
 * inline script beside it); the effect takes the text over hidden, so nothing flashes.
 */
export async function decodeIn(element: HTMLElement, name: Decoding, run: RunOptions = {}) {
  const effect = createAsciiReveal(element, { lazy: false });
  await effect.hide({ instant: true });
  release(name);
  try {
    sessionStorage.setItem(`decoded:${name}`, '1');
  } catch {
    // Storage can be blocked; the count then decodes on every homepage view.
  }
  await document.fonts.ready;
  await effect.reveal(run);
  effect.destroy();
}

/** Shows the hidden text without the effect, for when this file could not load. */
export function giveUp(name: Decoding) {
  release(name);
}

/**
 * For the README note: returns a function that decodes the note's text each time it opens.
 * `onHidden` runs once the effect holds the text, so the note can drop its own hiding rule.
 */
export function readmeDecoder(body: HTMLElement) {
  const effect = createAsciiReveal(body, { lazy: false });
  return async (opened: Promise<unknown>, onHidden: () => void) => {
    await effect.hide({ instant: true });
    onHidden();
    // The panel scales while it opens and the effect measures once, so wait for its resting size.
    await opened.catch(() => null);
    await effect.reveal({ origin: 'top-left' });
  };
}

/**
 * A faint field of drifting glyphs, drawn into a canvas that fills its positioned parent.
 * Adapted from the background of the ascii-reveal demo site (MIT License, Copyright (c) 2026
 * Quan Hoang). About 15 frames a second; nothing is drawn off screen, in a hidden tab or while
 * a decode runs. With reduced motion it draws one still frame.
 */
export function glyphField(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ramp = ' .·:-=+*';
  const cell = 16;
  const column = cell * 0.62 * 1.4;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let width = 0;
  let height = 0;
  let last = 0;
  let onScreen = true;
  let busy = false;

  const draw = (now: number) => {
    const t = still ? 0 : now - start;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    context.font = `${Math.round(cell * 0.8)}px ${getComputedStyle(canvas).fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = getComputedStyle(canvas).color;
    for (let y = 0; y < height + cell; y += cell) {
      for (let x = 0; x < width + column; x += column) {
        // Three slow waves in different directions; only their crests show.
        const wave = Math.sin(x * 0.006 + y * 0.004 + t * 0.00022)
          + Math.sin(x * 0.011 - y * 0.007 - t * 0.00017) * 0.6
          + Math.sin(y * 0.013 + t * 0.00013) * 0.4;
        const k = (wave - 0.55) / 1.45;
        if (k <= 0) continue;
        context.globalAlpha = 0.12 + 0.4 * k;
        context.fillText(ramp[Math.min(ramp.length - 1, 1 + Math.floor(k * (ramp.length - 1)))], x, y);
      }
    }
    context.globalAlpha = 1;
  };

  new ResizeObserver(() => {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    ({ width, height } = canvas.getBoundingClientRect());
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    draw(performance.now());
  }).observe(canvas);
  if (still) return;

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
  }).observe(canvas);
  document.addEventListener('asciireveal', (event) => {
    busy = Boolean((event as CustomEvent<{ active: boolean }>).detail?.active);
  });
  const loop = (now: number) => {
    requestAnimationFrame(loop);
    if (document.hidden || !onScreen || busy || now - last < 66) return;
    last = now;
    draw(now);
  };
  requestAnimationFrame(loop);
}
