import type { CollectionEntry } from 'astro:content';
import { site } from '../data/site';

/** `live` on the published site; `scheduled` and `draft` only show up in `npm run dev`. */
export type NoteStatus = 'live' | 'scheduled' | 'draft';
export type NumberedNote = CollectionEntry<'notes'> & { no: number | null; status: NoteStatus };

export function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatNo(n: number): string {
  return `No. ${String(n).padStart(2, '0')}`;
}

/** Calendar day in a time zone, e.g. "2026-11-24". Days compare as strings. */
export function dayIn(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/**
 * A note goes live on the calendar day of its date, in the site's time zone. The hour does
 * not count: the morning deploy runs before most notes' times. A draft never goes live.
 */
export function isPublished(data: { date: Date; draft?: boolean }, now: Date, timeZone: string): boolean {
  return !data.draft && dayIn(timeZone, data.date) <= dayIn(timeZone, now);
}

export function numberNotes<T extends { data: { date: Date; numbered: boolean } }>(
  notes: T[],
): (T & { no: number | null })[] {
  let no = 0;

  return [...notes]
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
    .map((note) => ({ ...note, no: note.data.numbered ? ++no : null }))
    .reverse();
}

/** The moment a build counts as "now". SITE_NOW pins it, so tests can build another day's site. */
function buildTime(): Date {
  const pinned = process.env.SITE_NOW;
  return pinned ? new Date(pinned) : new Date();
}

export async function getNotes(): Promise<NumberedNote[]> {
  // Keep the pure helpers usable without Astro's content runtime.
  const { getCollection } = await import('astro:content');
  const now = buildTime();
  const notes = (await getCollection('notes')).map((note) => ({
    ...note,
    status: (isPublished(note.data, now, site.timeZone) ? 'live' : note.data.draft ? 'draft' : 'scheduled') as NoteStatus,
  }));

  // Only the dev server shows drafts and scheduled notes (flag set in astro.config.mjs).
  return numberNotes(import.meta.env.SHOW_UNPUBLISHED ? notes : notes.filter((note) => note.status === 'live'));
}
