import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { site } from '../../src/data/site';
import { isPublished, numberNotes } from '../../src/lib/notes';

const notesDir = new URL('../../src/content/notes/', import.meta.url);
const projectsDir = new URL('../../src/content/projects/', import.meta.url);

export interface NoteFile {
  file: string;
  body: string;
  data: {
    title: string;
    description: string;
    slug: string;
    topic: string;
    date: Date;
    numbered: boolean;
    draft: boolean;
  };
}

/** Every note in src/content/notes, read straight from its front matter. */
export function readNotes(): NoteFile[] {
  return readdirSync(notesDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(new URL(file, notesDir), 'utf8');
      const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!match) throw new Error(`${file} has no front matter`);
      const raw = parse(match[1]);

      return {
        file,
        body: match[2],
        data: {
          title: String(raw.title),
          description: String(raw.description),
          slug: String(raw.slug),
          topic: String(raw.topic),
          date: new Date(raw.date),
          numbered: raw.numbered ?? true,
          draft: raw.draft ?? false,
        },
      };
    });
}

/** The notes a build made at `now` shows, newest first, numbered as the site numbers them. */
export function liveNotes(now: Date) {
  return numberNotes(readNotes().filter((note) => isPublished(note.data, now, site.timeZone)));
}

export const notesPath = fileURLToPath(notesDir);

export interface ProjectFile {
  id: string;
  title: string;
  oneLiner: string;
  receiptValue: string;
  /** When and how the receipt value was measured, if it is a measurement. */
  receiptNote?: string;
  body: string;
}

/** Every project, from its file name, front matter and case study. */
export function readProjects(): ProjectFile[] {
  return readdirSync(projectsDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const source = readFileSync(new URL(file, projectsDir), 'utf8');
      const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!match) throw new Error(`${file} has no front matter`);
      const data = parse(match[1]);
      return {
        id: file.replace(/\.mdx$/, ''),
        title: String(data.title),
        oneLiner: String(data.oneLiner),
        receiptValue: String(data.receiptValue),
        receiptNote: data.receiptNote === undefined ? undefined : String(data.receiptNote),
        body: match[2],
      };
    });
}
