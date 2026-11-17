import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { afterAll, expect, test } from 'vitest';
import { liveNotes, readNotes } from './helpers/content';
import { readDist } from './helpers/dist';

// Builds of the site under other settings than today's. They share Astro's cache folder,
// so they live in one file and run one after another.
const root = fileURLToPath(new URL('../', import.meta.url));
const made: string[] = [];

function build(env: Record<string, string>): (path: string) => string {
  const out = mkdtempSync(join(tmpdir(), 'site-variant-'));
  made.push(out);
  execFileSync('npx', ['astro', 'build', '--outDir', out], { cwd: root, env: { ...process.env, ...env }, stdio: 'pipe' });
  return (path) => join(out, path);
}

afterAll(() => made.forEach((out) => rmSync(out, { recursive: true, force: true })));

test('a build made the day before a note is due leaves that note out everywhere', () => {
  const newest = readNotes()
    .filter((note) => !note.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0];
  const dayBefore = new Date(newest.data.date.getTime() - 24 * 60 * 60 * 1000);
  const expected = liveNotes(dayBefore);

  const at = build({ SITE_NOW: dayBefore.toISOString() });
  const read = (path: string) => readFileSync(at(path), 'utf8');

  expect(expected.map((note) => note.data.slug)).not.toContain(newest.data.slug);
  expect(existsSync(at(`posts/${newest.data.slug}/index.html`))).toBe(false);
  expect(existsSync(at(`og/posts/${newest.data.slug}.png`))).toBe(false);
  for (const page of ['index.html', 'writing/index.html', 'feed.xml', 'llms.txt', 'sitemap-0.xml']) {
    expect(read(page)).not.toContain(`/posts/${newest.data.slug}/`);
  }
  // The notes that are live keep their pages, and none of them links to the hidden one.
  for (const note of expected) {
    expect(read(`posts/${note.data.slug}/index.html`)).not.toContain(`/posts/${newest.data.slug}/`);
  }
});

test('no page loads a visitor counter while no GoatCounter code is set', () => {
  for (const page of ['index.html', 'about/index.html', 'writing/index.html', '404.html']) {
    expect(readDist(page)).not.toContain('goatcounter');
    expect(readDist(page)).not.toContain('gc.zgo.at');
  }
});

test('with a GoatCounter code set, every page loads the counter for that code', () => {
  const at = build({ SITE_GOATCOUNTER: 'example-code' });

  for (const page of ['index.html', 'about/index.html', 'writing/index.html', 'projects/brain/index.html']) {
    const counter = load(readFileSync(at(page), 'utf8'))('script[data-goatcounter]');

    expect(counter).toHaveLength(1);
    expect(counter.attr('data-goatcounter')).toBe('https://example-code.goatcounter.com/count');
    expect(counter.attr('src')).toBe('https://gc.zgo.at/count.js');
    expect(counter.attr('async')).toBeDefined();
  }
});

test('a GoatCounter code that is not a plain site code stops the build', () => {
  expect(() => build({ SITE_GOATCOUNTER: 'evil.example/x?' })).toThrow();
});
