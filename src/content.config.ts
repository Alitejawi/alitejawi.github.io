import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { noteDate } from './lib/note-date';

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  // Strict: a key this schema does not know (say `status: draft`) fails the build
  // instead of being ignored, so a note can never publish by accident.
  schema: z.strictObject({
    title: z.string(),
    description: z.string(),
    // The note goes live on this calendar day (Spanish time). A later date schedules it.
    date: noteDate,
    slug: z.string(),
    numbered: z.boolean().default(true),
    // A draft is built by `npm run dev` only, whatever its date.
    draft: z.boolean().default(false),
    topic: z.string(),
    commands: z.array(z.strictObject({ label: z.string(), value: z.string() })).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/projects' }),
  schema: z.strictObject({
    title: z.string(),
    oneLiner: z.string(),
    receiptValue: z.string(),
    // When the receipt value was measured, printed under it. A measured number keeps its date.
    receiptNote: z.string().optional(),
    order: z.number(),
    video: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { notes, projects };
