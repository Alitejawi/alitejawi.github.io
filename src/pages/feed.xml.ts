import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { getNotes } from '../lib/notes';

/**
 * A note's HTML as a feed reader should get it: the same text as the page, without the
 * site's styling hooks, and with links that still work outside the site.
 */
function forFeed(html: string, page: string): string {
  return html
    // Syntax colouring is a span and a style per token; a reader needs only the code.
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/ (?:style|class|tabindex|data-[\w-]+)="[^"]*"/g, '')
    .replace(/(href|src)="\/(?!\/)/g, `$1="${site.url}/`)
    .replace(/href="#/g, `href="${page}#`);
}

export const GET: APIRoute = async () => {
  const notes = await getNotes();

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
