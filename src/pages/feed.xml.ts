import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { getNotes } from '../lib/notes';

export const GET: APIRoute = async () => {
  const notes = await getNotes();

  return rss({
    title: `${site.name} · Field notes`,
    description: 'Field notes on systems, scripts, and automation.',
    site: site.url,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.date,
      link: `/posts/${note.data.slug}/`,
    })),
  });
};
