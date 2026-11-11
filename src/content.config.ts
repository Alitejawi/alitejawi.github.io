import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    slug: z.string(),
    numbered: z.boolean().default(true),
    topic: z.string(),
    commands: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    oneLiner: z.string(),
    receiptValue: z.string(),
    order: z.number(),
    video: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { notes, projects };
