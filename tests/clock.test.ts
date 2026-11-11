import { expect, test } from 'vitest';
import { formatClock } from '../src/scripts/clock';

test('formatClock', () => {
  expect(formatClock(new Date('2026-11-11T20:14:00Z'), 'Europe/Amsterdam')).toBe('21:14');
});

test('formatClock uses the time zone through summer time and midnight', () => {
  expect(formatClock(new Date('2026-07-11T20:14:00Z'), 'Europe/Amsterdam')).toBe('22:14');
  expect(formatClock(new Date('2026-11-11T23:04:00Z'), 'Europe/Amsterdam')).toBe('00:04');
  expect(formatClock(new Date('2026-11-11T20:14:00Z'), 'UTC')).toBe('20:14');
});
