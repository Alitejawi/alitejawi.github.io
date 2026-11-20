import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import { PER_DAY, bumpEspresso, formatCount } from '../scripts/bump-espresso.mjs';
import espresso from '../src/data/espresso.json';

// The count goes up by 3 for every day, once. The data file keeps the last UTC day it counted
// (`through`), so a run that repeats a day adds nothing and a run after a missed one catches up.

let directory: string;
let path: string;

const write = (data: unknown) => writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data));
const read = () => JSON.parse(readFileSync(path, 'utf8'));

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'espresso-test-'));
  path = join(directory, 'espresso.json');
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

test('a new day adds 3 and becomes the last counted day', () => {
  write({ count: 13209, through: '2026-11-18' });

  expect(bumpEspresso(path, '2026-11-19')).toEqual({ from: 13209, to: 13212, days: 1 });
  expect(read()).toEqual({ count: 13212, through: '2026-11-19' });
  expect(readFileSync(path, 'utf8').endsWith('\n')).toBe(true);
});

test('a second run on the same day adds nothing and leaves the file alone', () => {
  write({ count: 100, through: '2026-11-18' });
  bumpEspresso(path, '2026-11-19');
  const after = readFileSync(path, 'utf8');

  expect(bumpEspresso(path, '2026-11-19')).toEqual({ from: 103, to: 103, days: 0 });
  expect(readFileSync(path, 'utf8')).toBe(after);
});

test('a run after missed days adds every day since the last counted one', () => {
  // Counted through Tuesday; Wednesday's run failed, Thursday was a rest day; Friday catches up.
  write({ count: 100, through: '2026-11-17' });

  expect(bumpEspresso(path, '2026-11-20')).toEqual({ from: 100, to: 109, days: 3 });
  expect(read()).toEqual({ count: 109, through: '2026-11-20' });
});

test('the count carries across a month and a year', () => {
  write({ count: 100, through: '2026-12-30' });

  expect(bumpEspresso(path, '2027-01-02')).toEqual({ from: 100, to: 109, days: 3 });
});

test('a day before the last counted one adds nothing', () => {
  write({ count: 100, through: '2026-11-19' });

  expect(bumpEspresso(path, '2026-11-18')).toEqual({ from: 100, to: 100, days: 0 });
  expect(read()).toEqual({ count: 100, through: '2026-11-19' });
});

test('an invalid file is refused and left as it is', () => {
  expect(() => bumpEspresso(path, '2026-11-19')).toThrow();
  expect(existsSync(path)).toBe(false);

  for (const contents of [
    '{}',
    'not json',
    'null',
    '[]',
    '{"count": "13,209", "through": "2026-11-18"}',
    '{"count": -1, "through": "2026-11-18"}',
    '{"count": 1.5, "through": "2026-11-18"}',
    '{"count": null, "through": "2026-11-18"}',
    '{"count": true, "through": "2026-11-18"}',
    // Without the last counted day there is no telling which days are already in the count.
    '{"count": 13209}',
    '{"count": 13209, "through": "yesterday"}',
    '{"count": 13209, "through": "2026-02-30"}',
    '{"count": 13209, "through": "2026-11-18T12:00:00Z"}',
  ]) {
    write(contents);

    expect(() => bumpEspresso(path, '2026-11-19'), contents).toThrow();
    expect(readFileSync(path, 'utf8')).toBe(contents);
  }
});

test('an invalid day to count up to is refused', () => {
  write({ count: 100, through: '2026-11-18' });

  for (const today of ['', 'today', '2026-11-31', '19/11/2026']) {
    expect(() => bumpEspresso(path, today), today).toThrow();
  }
  expect(read()).toEqual({ count: 100, through: '2026-11-18' });
});

test("formatCount(13209) === '13,209'", () => {
  expect(formatCount(13209)).toBe('13,209');
});

test('the CLI prints how many espressos it added, and nothing on a repeat', () => {
  mkdirSync(join(directory, 'scripts'));
  mkdirSync(join(directory, 'src/data'), { recursive: true });
  const script = join(directory, 'scripts/bump-espresso.mjs');
  const data = join(directory, 'src/data/espresso.json');
  copyFileSync(new URL('../scripts/bump-espresso.mjs', import.meta.url), script);
  const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd: tmpdir(), encoding: 'utf8' });

  const missing = run('2026-11-19');
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain('Failed to bump espresso count:');
  expect(existsSync(data)).toBe(false);

  for (const contents of ['{}', '{"count": 13209}', 'not json']) {
    writeFileSync(data, contents);
    const invalid = run('2026-11-19');
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain('Failed to bump espresso count:');
    expect(readFileSync(data, 'utf8')).toBe(contents);
  }

  writeFileSync(data, JSON.stringify({ count: 13209, through: '2026-11-17' }));
  const first = run('2026-11-19');
  expect(first.status).toBe(0);
  expect(first.stdout).toBe('6\n');
  expect(first.stderr).toBe('');
  expect(JSON.parse(readFileSync(data, 'utf8'))).toEqual({ count: 13215, through: '2026-11-19' });

  const repeat = run('2026-11-19');
  expect(repeat.status).toBe(0);
  expect(repeat.stdout).toBe('0\n');
  expect(JSON.parse(readFileSync(data, 'utf8'))).toEqual({ count: 13215, through: '2026-11-19' });
});

test('the CLI counts up to today, in UTC, when given no day', () => {
  mkdirSync(join(directory, 'scripts'));
  mkdirSync(join(directory, 'src/data'), { recursive: true });
  const script = join(directory, 'scripts/bump-espresso.mjs');
  const data = join(directory, 'src/data/espresso.json');
  copyFileSync(new URL('../scripts/bump-espresso.mjs', import.meta.url), script);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  writeFileSync(data, JSON.stringify({ count: 100, through: yesterday }));

  const run = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  expect(run.stdout).toBe(`${PER_DAY}\n`);
  expect(JSON.parse(readFileSync(data, 'utf8'))).toEqual({ count: 100 + PER_DAY, through: today });
});

test('the data file has a count and the last day it counted, not after today', () => {
  expect(Number.isInteger(espresso.count) && espresso.count >= 0).toBe(true);
  expect(espresso.through).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(espresso.through <= new Date().toISOString().slice(0, 10)).toBe(true);
});

describe('the Daily Espressos workflow', () => {
  const workflow = parse(readFileSync(new URL('../.github/workflows/daily-espressos.yml', import.meta.url), 'utf8'));
  const steps: { name: string; id?: string; if?: string; run?: string; uses?: string; with?: Record<string, string>; env?: Record<string, string> }[] = workflow.jobs.bump.steps;
  const step = (name: string) => {
    const found = steps.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`no step named "${name}"`);
    return found;
  };

  test('runs one at a time, each from the latest main, so two runs cannot add the same day', () => {
    expect(workflow.concurrency).toEqual({ group: 'daily-espressos', 'cancel-in-progress': false });
    expect(step('Checkout').with?.ref).toBe('main');
  });

  test('lets the script work out the days, and commits and deploys only when it added some', () => {
    const bump = step('Increment espressos counter');
    expect(bump.id).toBe('bump');
    // No days argument: the script counts the days from the date in the file.
    expect(bump.run).toContain('added=$(node scripts/bump-espresso.mjs)\n');
    expect(bump.run).toContain('echo "added=$added" >> "$GITHUB_OUTPUT"');

    const added = "steps.bump.outputs.added && steps.bump.outputs.added != '0'";
    for (const name of ['Commit and push', 'Trigger pages deploy']) expect(step(name).if).toBe(added);
    // The message names what the script added, so it always matches the change.
    expect(step('Commit and push').env?.ADDED).toBe('${{ steps.bump.outputs.added }}');
    expect(step('Commit and push').run).toContain('git commit -m "Daily espressos +$ADDED"');
  });
});
