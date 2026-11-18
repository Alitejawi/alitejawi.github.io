import { z } from 'astro/zod';

/**
 * A note's `date`. It must be a real date: coercion alone turns an empty `date:` into
 * 1 January 1970, which would publish the note at once and renumber every other note.
 */
export const noteDate = z.union([z.date(), z.string().trim().min(1)]).pipe(z.coerce.date());
