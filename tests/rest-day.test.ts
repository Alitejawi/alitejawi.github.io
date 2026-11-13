import { expect, test } from 'vitest';
import { daysToBump, isoWeek, isRestDay, restDays } from '../scripts/rest-day.mjs';

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

test('a work day after rest days catches up', () => {
  expect(isRestDay(day('2026-11-20'))).toBe(true); // Friday
  expect(daysToBump(day('2026-11-21'))).toBe(2); // Saturday covers Friday too
  expect(daysToBump(day('2026-11-18'))).toBe(1);
  expect(isRestDay(day('2026-01-05')) && isRestDay(day('2026-01-06'))).toBe(true);
  expect(daysToBump(day('2026-01-07'))).toBe(3);
});
