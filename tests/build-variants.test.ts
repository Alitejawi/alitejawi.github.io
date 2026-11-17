import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { afterAll, expect, test } from 'vitest';
import { site } from '../src/data/site';
import { liveNotes, notesPath, readNotes } from './helpers/content';
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

// Each of these runs a whole build: about two seconds here, more on a busy machine.
const BUILD = { timeout: 120_000 };

test('a build made the day before a note is due leaves that note out everywhere', BUILD, () => {
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

test('the built site loads a visitor counter only if site.ts names a GoatCounter code', () => {
  const code = site.analytics.goatcounter;

  for (const page of ['index.html', 'about/index.html', 'writing/index.html', '404.html']) {
    const counter = load(readDist(page))('script[data-goatcounter]');

    if (code) {
      expect(counter.attr('data-goatcounter')).toBe(`https://${code}.goatcounter.com/count`);
    } else {
      expect(counter).toHaveLength(0);
      expect(readDist(page)).not.toContain('gc.zgo.at');
    }
  }
});

test('a draft is left out of a build, whatever its date', BUILD, () => {
  // Written for this test and removed after it, so the check does not depend on a real
  // draft existing. The zz-test- prefix is git-ignored in case a run is cut short.
  const file = `${notesPath}zz-test-draft.md`;
  writeFileSync(file, [
    '---',
    'title: A draft that must not be built',
    'date: 2020-01-01 09:00:00 +0100',
    'description: Written by the tests to prove that a draft stays out of a build.',
    'slug: zz-test-draft',
    'topic: General',
    'draft: true',
    '---',
    '',
    '## A section',
    '',
    'Text that should appear nowhere.',
    '',
  ].join('\n'));

  try {
    const at = build({});

    expect(existsSync(at('posts/zz-test-draft/index.html'))).toBe(false);
    expect(existsSync(at('og/posts/zz-test-draft.png'))).toBe(false);
    for (const page of ['index.html', 'writing/index.html', 'feed.xml', 'llms.txt', 'sitemap-0.xml']) {
      expect(readFileSync(at(page), 'utf8')).not.toContain('zz-test-draft');
    }
    // It did not take a number either: the oldest numbered note is still No. 01.
    const oldest = liveNotes(new Date()).filter((note) => note.no !== null).at(-1)!;
    expect(load(readFileSync(at(`posts/${oldest.data.slug}/index.html`), 'utf8'))('.article-kicker').text()).toContain('No. 01');
  } finally {
    rmSync(file, { force: true });
  }
});

test('with a GoatCounter code set, every page loads the counter for that code', BUILD, () => {
  const at = build({ SITE_GOATCOUNTER: 'example-code' });

  for (const page of ['index.html', 'about/index.html', 'writing/index.html', 'projects/brain/index.html']) {
    const counter = load(readFileSync(at(page), 'utf8'))('script[data-goatcounter]');

    expect(counter).toHaveLength(1);
    expect(counter.attr('data-goatcounter')).toBe('https://example-code.goatcounter.com/count');
    expect(counter.attr('src')).toBe('https://gc.zgo.at/count.js');
    expect(counter.attr('async')).toBeDefined();
  }
});

test('a GoatCounter code that is not a plain site code stops the build, and says why', BUILD, () => {
  let output = '';
  try {
    build({ SITE_GOATCOUNTER: 'evil.example/x?' });
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    output = `${stdout ?? ''}${stderr ?? ''}`;
  }

  expect(output).toContain('is not a site code');
});
