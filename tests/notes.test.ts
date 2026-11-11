import { expect, test } from 'vitest';
import { formatNo, numberNotes, readMinutes } from '../src/lib/notes';

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
