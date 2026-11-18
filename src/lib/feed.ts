import { load } from 'cheerio';
import { site } from '../data/site';

// Attributes that only mean something on the site: styling hooks and script hooks.
const SITE_ONLY = /^(?:style|class|tabindex|data-.+)$/;

/**
 * A note's HTML as a feed reader should get it: the same words as the page, without the
 * site's styling hooks, and with links that still work outside the site. The HTML is parsed,
 * not pattern-matched, so a code sample whose text looks like markup is left alone.
 *
 * @param html the note as the page renders it
 * @param page the note's full address, for links that point inside it
 */
export function forFeed(html: string, page: string): string {
  const $ = load(html, null, false);

  // Syntax colouring is a span per token; a reader needs only the code.
  $('span').each((_, span) => {
    $(span).replaceWith($(span).contents());
  });
  $('*').each((_, element) => {
    if (!('attribs' in element)) return;
    for (const name of Object.keys(element.attribs)) {
      if (SITE_ONLY.test(name)) $(element).removeAttr(name);
    }
  });
  for (const attribute of ['href', 'src']) {
    $(`[${attribute}]`).each((_, element) => {
      const value = $(element).attr(attribute) ?? '';
      if (value.startsWith('#')) $(element).attr(attribute, `${page}${value}`);
      else if (value.startsWith('/') && !value.startsWith('//')) $(element).attr(attribute, `${site.url}${value}`);
    });
  }

  return $.html();
}
