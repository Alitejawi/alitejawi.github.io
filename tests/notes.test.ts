import { expect, test } from 'vitest';
import { dayIn, formatNo, isPublished, numberNotes, readMinutes } from '../src/lib/notes';

test('readMinutes', () => {
  expect(readMinutes('word '.repeat(440))).toBe(2);
  expect(readMinutes('')).toBe(1);
  expect(readMinutes('word '.repeat(221))).toBe(2);
  expect(readMinutes(' \n\t ')).toBe(1);
});

test('formatNo', () => {
  expect(formatNo(1)).toBe('No. 01');
  expect(formatNo(12)).toBe('No. 12');
});

test('numberNotes', () => {
  const welcome = {
    id: 'welcome',
    data: { date: new Date('2025-02-06'), numbered: false },
  };
  const delegate = {
    id: 'delegate',
    data: { date: new Date('2025-02-07'), numbered: true },
  };
  const monday = {
    id: 'monday',
    data: { date: new Date('2026-05-11'), numbered: true },
  };
  const notes = [delegate, welcome, monday];

  expect(numberNotes(notes)).toEqual([
    { ...monday, no: 2 },
    { ...delegate, no: 1 },
    { ...welcome, no: null },
  ]);
  expect(notes).toEqual([delegate, welcome, monday]);
  expect(notes.every((note) => !('no' in note))).toBe(true);
});

test('dayIn gives the calendar day in a time zone', () => {
  // 23:10 UTC on the 23rd is already the 24th in Amsterdam (UTC+1 in winter).
  expect(dayIn('Europe/Amsterdam', new Date('2026-11-23T23:10:00Z'))).toBe('2026-11-24');
  expect(dayIn('Europe/Amsterdam', new Date('2026-11-23T22:50:00Z'))).toBe('2026-11-23');
  // Summer time is UTC+2.
  expect(dayIn('Europe/Amsterdam', new Date('2026-07-01T22:10:00Z'))).toBe('2026-07-02');
});

test('a note goes live on the Amsterdam calendar day of its date', () => {
  const note = { date: new Date('2026-11-24T09:00:00+01:00'), draft: false };
  const live = (now: string) => isPublished(note, new Date(now), 'Europe/Amsterdam');

  expect(live('2026-11-23T23:59:00+01:00')).toBe(false);
  // The morning deploy runs before 09:00; the day counts, not the hour.
  expect(live('2026-11-24T00:01:00+01:00')).toBe(true);
  expect(live('2026-11-24T08:02:00+01:00')).toBe(true);
  expect(live('2027-01-01T12:00:00+01:00')).toBe(true);
});

test('a draft never goes live, whatever its date', () => {
  const draft = { date: new Date('2025-01-01T09:00:00+01:00'), draft: true };

  expect(isPublished(draft, new Date('2026-11-24T12:00:00+01:00'), 'Europe/Amsterdam')).toBe(false);
});
