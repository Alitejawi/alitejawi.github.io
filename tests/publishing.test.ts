import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, test } from 'vitest';
import { liveNotes, readNotes } from './helpers/content';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'site-scheduled-'));

afterAll(() => rmSync(out, { recursive: true, force: true }));

test('a build made the day before a note is due leaves that note out everywhere', () => {
  const newest = readNotes()
    .filter((note) => !note.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0];
  const dayBefore = new Date(newest.data.date.getTime() - 24 * 60 * 60 * 1000);
  const expected = liveNotes(dayBefore);

  execFileSync('npx', ['astro', 'build', '--outDir', out], {
    cwd: root,
    env: { ...process.env, SITE_NOW: dayBefore.toISOString() },
    stdio: 'pipe',
  });
  const read = (path: string) => readFileSync(join(out, path), 'utf8');

  expect(expected.map((note) => note.data.slug)).not.toContain(newest.data.slug);
  expect(existsSync(join(out, 'posts', newest.data.slug, 'index.html'))).toBe(false);
  for (const page of ['index.html', 'writing/index.html', 'feed.xml', 'llms.txt', 'sitemap-0.xml']) {
    expect(read(page)).not.toContain(`/posts/${newest.data.slug}/`);
  }
  // The notes that are live keep their pages, and none of them links to the hidden one.
  for (const note of expected) {
    expect(read(`posts/${note.data.slug}/index.html`)).not.toContain(`/posts/${newest.data.slug}/`);
  }
});
