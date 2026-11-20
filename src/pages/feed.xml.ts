import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { forFeed } from '../lib/feed';
import { getNotes } from '../lib/notes';

export const GET: APIRoute = async () => {
  // A note can opt out with `feed: false`: the feed is the one place that prints its date.
  const notes = (await getNotes()).filter((note) => note.data.feed);

  return rss({
    title: `${site.name} · Field notes`,
    description: 'Field notes on systems, scripts, and automation.',
    site: site.url,
    customData: '<language>en</language>',
    items: notes.map((note) => {
      const link = `/posts/${note.data.slug}/`;

      return {
        title: note.data.title,
        description: note.data.description,
        pubDate: note.data.date,
        link,
        content: forFeed(note.rendered?.html ?? '', new URL(link, site.url).href),
      };
    }),
  });
};
