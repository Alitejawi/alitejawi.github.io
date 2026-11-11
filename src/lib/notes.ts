import type { CollectionEntry } from 'astro:content';

export type NumberedNote = CollectionEntry<'notes'> & { no: number | null };

export function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatNo(n: number): string {
  return `No. ${String(n).padStart(2, '0')}`;
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

export async function getNotes(): Promise<NumberedNote[]> {
  // Keep the pure helpers usable without Astro's content runtime.
  const { getCollection } = await import('astro:content');
  return numberNotes(await getCollection('notes'));
}
