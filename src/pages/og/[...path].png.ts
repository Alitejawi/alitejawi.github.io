import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard, type Card } from '../../lib/og-card';
import { formatNo, getNotes, readMinutes } from '../../lib/notes';

// One link-preview image per note and project, at /og/posts/<slug>.png and
// /og/projects/<id>.png. The Article layout points each page's og:image at its file.
export const getStaticPaths = (async () => {
  const minutes = (body: string | undefined) => `${readMinutes(body ?? '')} min read`;
  const notes = (await getNotes()).map((note) => ({
    params: { path: `posts/${note.data.slug}` },
    props: {
      kicker: note.no === null ? 'Field note' : `Field note ${formatNo(note.no)}`,
      chip: note.data.topic,
      meta: minutes(note.body),
      title: note.data.title,
    } satisfies Card,
  }));
  const projects = (await getCollection('projects')).map((project) => ({
    params: { path: `projects/${project.id}` },
    props: { kicker: 'Project', meta: minutes(project.body), title: project.data.title } satisfies Card,
  }));

  return [...notes, ...projects];
}) satisfies GetStaticPaths;

export const GET: APIRoute<Card> = async ({ props }) =>
  new Response(await renderCard(props), { headers: { 'Content-Type': 'image/png' } });
