import { readFileSync } from 'node:fs';

// Every page in the sitemap, so a new note or project is covered without an edit in the tests.
const sitemap = readFileSync(new URL('../../../dist/sitemap-0.xml', import.meta.url), 'utf8');

export const pages = [...sitemap.matchAll(/<loc>https:\/\/itejawi\.com([^<]*)<\/loc>/g)].map((match) => match[1]);
/** The first field note that has code blocks and a contents receipt. */
export const longNote = '/posts/delete-lock-for-ai-agents/';
