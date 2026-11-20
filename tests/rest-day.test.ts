import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { isoWeek, isRestDay, restDays } from '../scripts/rest-day.mjs';

const day = (s: string) => new Date(`${s}T12:00:00Z`);

test('isoWeek handles year edges', () => {
  expect(isoWeek(day('2026-11-13'))).toBe('2026-W46');
  expect(isoWeek(day('2027-01-01'))).toBe('2026-W53');
  expect(isoWeek(day('2025-12-29'))).toBe('2026-W01');
});

test('rest days match brain-sync rest-day.sh', () => {
  // Reference values from `rest-day.sh --week <monday>` in the n8n repo.
  expect(restDays(day('2026-01-05'))).toEqual([1, 2]);
  expect(restDays(day('2026-03-02'))).toEqual([1]);
  expect(restDays(day('2026-06-29'))).toEqual([5]);
  expect(restDays(day('2026-11-09'))).toEqual([4, 1]);
  expect(restDays(day('2026-11-16'))).toEqual([5]);
  expect(restDays(day('2026-12-28'))).toEqual([1, 4]);
  expect(restDays(day('2027-01-04'))).toEqual([3, 4]);
});

test('the CLI says whether a day is a rest day or a work day', () => {
  const script = fileURLToPath(new URL('../scripts/rest-day.mjs', import.meta.url));
  const run = (date: string) => spawnSync(process.execPath, [script, date], { encoding: 'utf8' }).stdout;

  expect(isRestDay(day('2026-11-20'))).toBe(true); // Friday
  expect(run('2026-11-20')).toBe('rest\n');
  expect(run('2026-11-21')).toBe('work\n');
});
