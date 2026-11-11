import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { bumpEspresso, formatCount } from '../scripts/bump-espresso.mjs';

let directory: string;
let path: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'espresso-test-'));
  path = join(directory, 'espresso.json');
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

test('bumpEspresso adds 2', () => {
  writeFileSync(path, JSON.stringify({ count: 13209 }));

  expect(bumpEspresso(path)).toEqual({ from: 13209, to: 13211 });
  const contents = readFileSync(path, 'utf8');
  expect(JSON.parse(contents)).toEqual({ count: 13211 });
  expect(contents.endsWith('\n')).toBe(true);
});

test('bumpEspresso rejects invalid file', () => {
  expect(() => bumpEspresso(path)).toThrow();
  expect(existsSync(path)).toBe(false);

  for (const contents of [
    '{}',
    '{"count": "13,209"}',
    'not json',
    '{"count": -1}',
    '{"count": 1.5}',
    '{"count": null}',
    '{"count": true}',
    'null',
    '[]',
  ]) {
    writeFileSync(path, contents);

    expect(() => bumpEspresso(path)).toThrow();
    expect(readFileSync(path, 'utf8')).toBe(contents);
  }
});

test("formatCount(13209) === '13,209'", () => {
  expect(formatCount(13209)).toBe('13,209');
});

test('CLI bumps data and rejects invalid files', () => {
  mkdirSync(join(directory, 'scripts'));
  mkdirSync(join(directory, 'src/data'), { recursive: true });
  const script = join(directory, 'scripts/bump-espresso.mjs');
  const data = join(directory, 'src/data/espresso.json');
  copyFileSync(new URL('../scripts/bump-espresso.mjs', import.meta.url), script);
  const run = () => spawnSync(process.execPath, [script], { cwd: tmpdir(), encoding: 'utf8' });

  const missing = run();
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain('Failed to bump espresso count:');
  expect(existsSync(data)).toBe(false);

  for (const contents of ['{}', '{"count": "13,209"}', 'not json']) {
    writeFileSync(data, contents);
    const invalid = run();
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain('Failed to bump espresso count:');
    expect(readFileSync(data, 'utf8')).toBe(contents);
  }

  writeFileSync(data, JSON.stringify({ count: 13209 }));
  const success = run();
  expect(success.status).toBe(0);
  expect(success.stdout).toBe('13209 -> 13211\n');
  expect(success.stderr).toBe('');
  expect(JSON.parse(readFileSync(data, 'utf8'))).toEqual({ count: 13211 });
});
