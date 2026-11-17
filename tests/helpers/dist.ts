import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';

const root = fileURLToPath(new URL('../../', import.meta.url));

/**
 * The tests check the site as it will be once every scheduled note is live. Checked only
 * on the day it is due, a scheduled note with a problem would stop that morning's deploy.
 * Drafts stay out. The deploy builds again with the real date.
 */
export const ALL_SCHEDULED_LIVE = new Date('9999-12-31T00:00:00Z');

// Vitest runs this once before all tests, so assertions read a fresh build.
export function setup(): void {
  execFileSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SITE_NOW: ALL_SCHEDULED_LIVE.toISOString() },
  });
}

export function readDist(path: string): string {
  return readFileSync(join(root, 'dist', path), 'utf8');
}

export function loadDist(path: string): CheerioAPI {
  return load(readDist(path));
}
