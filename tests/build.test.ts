import { existsSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
import { formatCount } from '../scripts/bump-espresso.mjs';
import { bio } from '../src/data/bio';
import espresso from '../src/data/espresso.json';
import { loadDist, readDist } from './helpers/dist';

test('CNAME is itejawi.com', () => {
  expect(readDist('CNAME').trim()).toBe('itejawi.com');
});

test('favicons and og image keep their paths', () => {
  for (const file of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png']) {
    expect(existsSync(new URL(`../dist/assets/img/favicons/${file}`, import.meta.url))).toBe(true);
  }
  expect(existsSync(new URL('../dist/assets/img/og.png', import.meta.url))).toBe(true);
});

test('site icon is the original receipt drawing, with no old-theme leftovers', () => {
  const icon = readDist('assets/img/favicons/favicon.svg');

  expect(icon).toContain('#ff9100');
  expect(icon).not.toContain('data:image');
  for (const leftover of ['site.webmanifest', 'browserconfig.xml', 'web-app-manifest-192x192.png']) {
    expect(existsSync(new URL(`../dist/assets/img/favicons/${leftover}`, import.meta.url))).toBe(false);
  }
});

test('JSON-LD Person has no employer', () => {
  const $ = loadDist('index.html');
  const person = JSON.parse($('script[type="application/ld+json"]').text());

  expect(person['@type']).toBe('Person');
  expect(person).not.toHaveProperty('worksFor');
  expect(person).not.toHaveProperty('alumniOf');
});

test('no Google Fonts requests', () => {
  expect(readDist('index.html')).not.toContain('fonts.googleapis.com');
});

test('legacy URLs exist with exact casing', () => {
  // Compare emitted names, even on a case-insensitive development filesystem.
  const paths = readdirSync(new URL('../dist/', import.meta.url), { recursive: true });

  expect(paths).toContain('posts/Add_gmail_delegate_silently/index.html');
  expect(paths).toContain('posts/three-gam-commands-every-monday/index.html');
  expect(paths).toContain('posts/Welcome/index.html');
  expect(paths).not.toContain('posts/add_gmail_delegate_silently/index.html');
});

test('feed.xml lists the notes', () => {
  const feed = readDist('feed.xml');

  expect(feed).toContain('How to add a Google Workspace delegate without notifying the user');
  expect(feed).toContain('Three GAM commands I run every Monday morning');
  expect(feed).toContain('A delete lock for AI agents: parsing shell commands in a PreToolUse hook');
  for (const slug of ['Add_gmail_delegate_silently', 'three-gam-commands-every-monday', 'delete-lock-for-ai-agents', 'Welcome']) {
    expect(feed).toContain(`https://itejawi.com/posts/${slug}/`);
  }
});

test('old taxonomy pages redirect', () => {
  for (const page of ['tags', 'categories', 'archives']) {
    const $ = loadDist(`${page}/index.html`);

    expect($('meta[http-equiv="refresh" i]').attr('content')).toContain('/writing/');
  }
});

test('writing index has no dates', () => {
  const html = readDist('writing/index.html');
  const $ = loadDist('writing/index.html');

  expect(html).toContain('No. 01');
  expect(html).toContain('No. 02');
  expect(html).toContain('No. 03');
  // Post dates stay hidden; the footer's copyright year is outside <main>.
  for (const date of ['2025', '2026', 'Feb', 'May', 'Nov']) {
    expect($('main').text()).not.toContain(date);
  }
  expect($('footer.site-footer').text()).toContain(`© ${new Date().getFullYear()} Ali Al-Itejawi`);
  expect($('main ol li a').map((_, link) => $(link).attr('href')).get()).toEqual([
    '/posts/delete-lock-for-ai-agents/',
    '/posts/three-gam-commands-every-monday/',
    '/posts/Add_gmail_delegate_silently/',
    '/posts/Welcome/',
  ]);
  expect($('main ol li').last().text()).not.toContain('No.');
  expect($('main ol li').toArray().every((item) => /\d+ min/.test($(item).text()))).toBe(true);
});

test('post shows kicker, chip and read time', () => {
  const html = readDist('posts/Add_gmail_delegate_silently/index.html');

  expect(html).toContain('Field note No. 01');
  expect(html).toContain('Google Workspace');
  expect(html).toContain('min read');
});

test('post shows no date', () => {
  const html = readDist('posts/Add_gmail_delegate_silently/index.html');

  expect(html).not.toContain('2025');
  expect(html).not.toContain('Feb');
});

test('contents receipt lists sections', () => {
  const $ = loadDist('posts/Add_gmail_delegate_silently/index.html');
  const contents = $('[data-contents]');

  expect(contents.text()).toContain('Default delegation');
  expect(contents.find('a[href="#default-delegation"]').first().text()).toContain('01 Default delegation');
});

test('no contents receipt when a note has no h2', () => {
  const $ = loadDist('posts/Welcome/index.html');

  expect($('[data-contents]').length).toBe(0);
});

test('commands receipt', () => {
  const html = readDist('posts/Add_gmail_delegate_silently/index.html');
  const $ = loadDist('posts/Add_gmail_delegate_silently/index.html');
  const commands = $('[data-receipt]').filter((_, element) => $(element).text().includes('Commands used'));

  expect(html).toContain('show delegates');
  expect(commands.text()).toContain('delegate to');
  expect(commands.text()).toContain('Add');
  expect(commands.text()).toContain('show delegates');
  expect(commands.text()).toContain('Verify');
  expect(commands.text()).toContain('delete delegate');
  expect(commands.text()).toContain('Remove');
});

const lockNote = 'posts/delete-lock-for-ai-agents/index.html';
const lockSections = [
  'The problem',
  'The hook',
  'Parsing the command as data',
  'Rules are data too',
  'Rollout: log first, then deny',
  'What went wrong, and what I changed',
  'The catch',
];
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

test('delete-lock note is field note No. 03 under AI agents', () => {
  const $ = loadDist(lockNote);

  expect($('.article-kicker').text()).toContain('Field note No. 03');
  expect($('.article-kicker').text()).toContain('AI agents');
  expect($('h1').map((_, heading) => squash($(heading).text())).get()).toEqual([
    'A delete lock for AI agents: parsing shell commands in a PreToolUse hook',
  ]);
});

test('delete-lock note leaves section numbering to the contents receipt', () => {
  const $ = loadDist(lockNote);
  const headings = $('.article-body h2').map((_, heading) => squash($(heading).text())).get();
  const lines = $('.contents-desktop nav a').map((_, link) => squash($(link).text())).get();

  expect(headings).toEqual(lockSections);
  expect(lines).toHaveLength(lockSections.length);
  lockSections.forEach((section, index) => expect(lines[index]).toContain(`0${index + 1} ${section}`));
});

test('delete-lock note says its opening line once', () => {
  const $ = loadDist(lockNote);

  expect($('.lede').text()).toContain('is a prompt');
  expect($('.article-body').text()).not.toContain('is a prompt');
});

test('delete-lock note points at no post that does not exist yet', () => {
  const text = loadDist(lockNote)('article').text();

  for (const phrase of ['next post', 'See also', 'approval panel', 'verifier agent', 'part of the series']) {
    expect(text).not.toContain(phrase);
  }
});

test('delete-lock note only says what the check on the real files backed up', () => {
  const text = squash(loadDist(lockNote)('article').text());

  for (const fact of [
    'ten got through, in four groups',
    'reported 441 passing checks',
    'all 557 checks',
    '35.5 ms per call',
    '562 checks',
    '--mode log',
    'onFailure field',
    'the call runs',
    'rests on my log',
    'and seven more',
    'over 1 MiB',
    'on a short deny list',
    'Codex workers',
  ]) {
    expect(text).toContain(fact);
  }
  for (const claim of [
    'ten call shapes',
    'ten shapes',
    'It fails closed',
    '--mode deny',
    'median run was 35 ms',
    'empty, revoke',
    'stdbuf and eval in front',
    'and a few more',
    'tool batch file.csv',
  ]) {
    expect(text).not.toContain(claim);
  }
});

test('homepage shows espresso count', () => {
  const html = readDist('index.html');

  expect(html).toContain(formatCount(espresso.count));
  expect(html).toContain('+2 every day');
});

test('homepage receipt lists numbered notes only', () => {
  const $ = loadDist('index.html');
  const receipt = $('[data-receipt]');

  expect(receipt).toHaveLength(1);
  expect(receipt.text()).toContain('No. 01');
  expect(receipt.text()).toContain('No. 02');
  expect(receipt.text()).not.toContain('Welcome');
});

test('homepage has no dates and no Work section', () => {
  const $ = loadDist('index.html');
  const receipt = $('[data-receipt]');

  expect(receipt).toHaveLength(1);
  expect(receipt.text()).not.toContain('2025');
  expect(receipt.text()).not.toContain('2026');
  const headings = $('h1, h2, h3, h4, h5, h6').map((_, heading) => $(heading).text().trim()).get();
  expect(headings).not.toContain('Work');
});

test('case studies exist', () => {
  for (const slug of ['brain', 'daily-diff']) {
    expect(existsSync(new URL(`../dist/projects/${slug}/index.html`, import.meta.url))).toBe(true);
    const $ = loadDist(`projects/${slug}/index.html`);
    expect($('.article-kicker').text()).toContain('Project');
    expect($('[data-contents] a[href="#problem"]').length).toBeGreaterThan(0);
  }

  const $ = loadDist('projects/index.html');
  expect($('main a').map((_, link) => $(link).attr('href')).get()).toEqual([
    '/projects/brain/',
    '/projects/daily-diff/',
  ]);
});

test('brain shows real eval numbers', () => {
  const html = readDist('projects/brain/index.html');

  // Only figures that the source repos back (audit of 2026-11-12).
  // Figures backed by the Mac Studio evidence check of 2026-11-12.
  for (const value of ['42%', '68%', '22%', '40%', '64%', '1,476', '524', '676', '9 November 2026', 'Brain runs on my own 3,644 notes']) {
    expect(html).toContain(value);
  }
  for (const wrong of ['66%', '545', 'real queries', 'every day since', 'no saved link']) {
    expect(html).not.toContain(wrong);
  }
  const $ = loadDist('projects/brain/index.html');
  expect($('figure').text()).toContain('Fig. 01 · Before and after on the same 50 test queries, 9 November 2026');
});

test('daily diff uses real numbers', () => {
  const html = readDist('projects/daily-diff/index.html');

  expect(html).toContain('193');
  expect(html).toContain('18');
  expect(html).not.toContain('214');
  expect(html).not.toContain('5 picks');
  const $ = loadDist('projects/daily-diff/index.html');
  expect($('figure').text()).toContain('Fig. 01 · Three weeks of briefs, as a receipt');
  expect(html).toContain('6, 7 or 8 November');
});

test('no code links', () => {
  const pages = readdirSync(new URL('../dist/projects/', import.meta.url), { recursive: true })
    .filter((path): path is string => typeof path === 'string' && path.endsWith('.html'));

  expect(pages.length).toBeGreaterThanOrEqual(3);
  for (const path of pages) {
    const $ = loadDist(`projects/${path}`);
    for (const link of $('a[href]').toArray()) {
      expect($(link).attr('href')).not.toMatch(/github\.com\/Alitejawi\/(?:n8n|brain)/i);
    }
  }
});

test('placeholders are hidden while site.showPlaceholders is false', () => {
  for (const page of ['projects/daily-diff/index.html', 'projects/brain/index.html']) {
    expect(readDist(page)).not.toContain('FILL IN');
    expect(loadDist(page)('[data-fill-in]')).toHaveLength(0);
  }
  expect(loadDist('projects/daily-diff/index.html')('main').text()).toContain('I keep forgetting where I save things.');
});

test('about shows live espresso count', () => {
  const html = readDist('about/index.html');

  expect(html).toContain(formatCount(espresso.count));
  expect(html).toContain('29');
});

test('about has no books placeholder', () => {
  expect(readDist('about/index.html')).not.toContain('TBA');
});

test('now page exists', () => {
  const html = readDist('now/index.html');

  expect(html).toContain('Improved offboarding pipelines');
  expect(html).toContain('Automated DLP security reporting and fixes');
  expect(html).toContain('Fine-tuning local AI models for inference');
  expect(html).not.toContain('FILL IN');
});

test('robots.txt allows crawling', () => {
  const robots = readDist('robots.txt');

  expect(robots).toContain('User-agent: *');
  expect(robots).toContain('Allow: /');
  expect(robots).not.toContain('Disallow');
  expect(robots).toContain('Sitemap: https://itejawi.com/sitemap-index.xml');
});

test('llms.txt summarises the site from the same data as the pages', () => {
  const llms = readDist('llms.txt');

  expect(llms.startsWith('# Ali Al-Itejawi\n')).toBe(true);
  expect(llms).toContain('https://itejawi.com/projects/brain/');
  expect(llms).toContain('https://itejawi.com/projects/daily-diff/');
  expect(llms).toContain('https://itejawi.com/posts/Add_gmail_delegate_silently/');
  expect(llms).toContain('https://itejawi.com/posts/three-gam-commands-every-monday/');
  expect(llms).toContain('https://itejawi.com/posts/delete-lock-for-ai-agents/');
  expect(llms).not.toContain('/posts/Welcome/');
  expect(llms).not.toContain('FILL IN');
  expect(llms).not.toMatch(/\b20\d\d\b/);
});

test('no empty image boxes while site.showPlaceholders is false', () => {
  for (const page of ['index.html', 'projects/index.html']) {
    expect(readDist(page)).not.toContain('Image coming soon');
    expect(loadDist(page)('.project-image')).toHaveLength(0);
  }
});

test('link preview declares its size and alt text', () => {
  const $ = loadDist('index.html');

  expect($('meta[property="og:image"]').attr('content')).toBe('https://itejawi.com/assets/img/og.png');
  expect($('meta[property="og:image:width"]').attr('content')).toBe('1200');
  expect($('meta[property="og:image:height"]').attr('content')).toBe('630');
  expect($('meta[property="og:image:alt"]').attr('content')).toContain('Ali Al-Itejawi');
});

test('sitemap lists the real pages and leaves out redirects', () => {
  expect(readDist('sitemap-index.xml')).toContain('https://itejawi.com/sitemap-0.xml');
  const sitemap = readDist('sitemap-0.xml');

  for (const path of ['/', '/writing/', '/projects/', '/projects/brain/', '/projects/daily-diff/',
    '/posts/Add_gmail_delegate_silently/', '/posts/three-gam-commands-every-monday/',
    '/posts/delete-lock-for-ai-agents/', '/about/', '/now/']) {
    expect(sitemap).toContain(`<loc>https://itejawi.com${path}</loc>`);
  }
  for (const path of ['/tags/', '/categories/', '/archives/', '/404']) {
    expect(sitemap).not.toContain(`https://itejawi.com${path}`);
  }
});

test('not-found page offers a way back and stays out of search', () => {
  const $ = loadDist('404.html');

  expect($('h1').text()).toContain("This page isn't on the receipt.");
  for (const href of ['/', '/projects/', '/writing/']) {
    expect($(`main a[href="${href}"]`).length).toBeGreaterThan(0);
  }
  expect($('meta[name="robots"]').attr('content')).toContain('noindex');
  expect(loadDist('index.html')('meta[name="robots"]')).toHaveLength(0);
});

test('every page carries the README button and note', () => {
  for (const page of ['index.html', 'about/index.html', 'writing/index.html', 'projects/brain/index.html', '404.html']) {
    const $ = loadDist(page);
    const note = $('dialog[data-readme]');

    expect($('button[data-readme-open]')).toHaveLength(1);
    expect(note).toHaveLength(1);
    expect(note.find('h3').map((_, heading) => $(heading).text().trim()).get()).toEqual([
      '001 / Why I build things',
      '002 / How I work',
      '003 / Who am I',
    ]);
  }
});

test('README button stays hidden until its script can open the note', () => {
  // Without JavaScript the button could do nothing; the About link in the nav covers that case.
  expect(loadDist('index.html')('button[data-readme-open]').attr('hidden')).toBeDefined();
});

test('README note and About page share one copy of the bio', () => {
  const note = loadDist('index.html')('dialog[data-readme]').text().replace(/\s+/g, ' ');
  const about = loadDist('about/index.html')('main').text().replace(/\s+/g, ' ');

  for (const sentence of Object.values(bio.copy)) {
    expect(note).toContain(sentence);
    expect(about).toContain(sentence);
  }
  expect(note).toContain(formatCount(espresso.count));
  expect(note).toContain(bio.facts.countries);
  expect(note).toContain(bio.facts.music);
});

test('README note only says what the case studies back up', () => {
  const $ = loadDist('index.html');
  const note = $('dialog[data-readme]');
  const text = note.text().replace(/\s+/g, ' ');

  expect(text).toContain('the same 50 test queries');
  expect(text).toContain('ten weeks');
  expect(text).toContain('all eight');
  // Words next to links keep their spaces.
  expect(text).toContain('what actually arrived, and wrote up what happened.');
  expect(text).toContain('Find me on GitHub and LinkedIn, or write to ali@itejawi.com.');
  expect(note.find('a[href="/projects/brain/#what-i-changed-after-launch"]')).toHaveLength(1);
  expect(loadDist('projects/brain/index.html')('#what-i-changed-after-launch')).toHaveLength(1);
  for (const leftover of ['Your words go here', 'FILL IN', 'every change']) {
    expect(text).not.toContain(leftover);
  }
});
