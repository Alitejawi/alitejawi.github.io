import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { getNotes } from '../lib/notes';

// A plain-text summary of the site for AI assistants (llmstxt.org format).
// Generated from the same data as the pages, so it cannot drift from them.
export const GET: APIRoute = async () => {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const notes = (await getNotes()).filter((note) => note.no !== null);
  const url = (path: string) => new URL(path, site.url).href;

  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.role} in ${site.location}. ${site.headline} ${site.lede}`,
    '',
    'Personal site: projects I have built, and field notes on security, systems and IT automation.',
    '',
    '## Projects',
    '',
    ...projects.map((project) => `- [${project.data.title}](${url(`/projects/${project.id}/`)}): ${project.data.oneLiner}`),
    '',
    '## Field notes',
    '',
    ...notes.map((note) => `- [${note.data.title}](${url(`/posts/${note.data.slug}/`)}): ${note.data.description}`),
    '',
    '## About',
    '',
    `- [About](${url('/about/')}): Background in security, systems and IT.`,
    `- [Now](${url('/now/')}): What I am building and reading.`,
    `- [RSS feed](${url('/feed.xml')}): New field notes.`,
    '',
    '## Contact',
    '',
    `- [Email](mailto:${site.email})`,
    `- [GitHub](${site.links.github})`,
    `- [LinkedIn](${site.links.linkedin})`,
  ];

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
