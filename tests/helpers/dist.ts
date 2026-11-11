import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Vitest runs this once before all tests, so assertions read a fresh build.
export function setup(): void {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
}

export function readDist(path: string): string {
  return readFileSync(join(root, 'dist', path), 'utf8');
}

export function loadDist(path: string): CheerioAPI {
  return load(readDist(path));
}
