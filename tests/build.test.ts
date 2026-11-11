import { existsSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
import { formatCount } from '../scripts/bump-espresso.mjs';
import espresso from '../src/data/espresso.json';
import { loadDist, readDist } from './helpers/dist';

test('CNAME is itejawi.com', () => {
  expect(readDist('CNAME').trim()).toBe('itejawi.com');
});

test('favicons and og image keep their paths', () => {
  expect(existsSync(new URL('../dist/assets/img/favicons/favicon.ico', import.meta.url))).toBe(true);
  expect(existsSync(new URL('../dist/assets/img/og.png', import.meta.url))).toBe(true);
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
  for (const slug of ['Add_gmail_delegate_silently', 'three-gam-commands-every-monday', 'Welcome']) {
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
  // Post dates stay hidden; the footer's copyright year is outside <main>.
  for (const date of ['2025', '2026', 'Feb', 'May']) {
    expect($('main').text()).not.toContain(date);
  }
  expect($('footer.site-footer').text()).toContain(`© ${new Date().getFullYear()} Ali Al-Itejawi`);
  expect($('main ol li a').map((_, link) => $(link).attr('href')).get()).toEqual([
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

  for (const value of ['42%', '68%', '22%', '40%', '1,476']) {
    expect(html).toContain(value);
  }
  const $ = loadDist('projects/brain/index.html');
  expect($('figure').text()).toContain('Fig. 01 · Hybrid search on 50 frozen queries');
});

test('daily diff uses real numbers', () => {
  const html = readDist('projects/daily-diff/index.html');

  expect(html).toContain('193');
  expect(html).toContain('18');
  expect(html).not.toContain('214');
  expect(html).not.toContain('5 picks');
  const $ = loadDist('projects/daily-diff/index.html');
  expect($('figure').text()).toContain("Fig. 01 · One morning's brief, as a receipt");
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
});

test('llms.txt summarises the site from the same data as the pages', () => {
  const llms = readDist('llms.txt');

  expect(llms.startsWith('# Ali Al-Itejawi\n')).toBe(true);
  expect(llms).toContain('https://itejawi.com/projects/brain/');
  expect(llms).toContain('https://itejawi.com/projects/daily-diff/');
  expect(llms).toContain('https://itejawi.com/posts/Add_gmail_delegate_silently/');
  expect(llms).toContain('https://itejawi.com/posts/three-gam-commands-every-monday/');
  expect(llms).not.toContain('/posts/Welcome/');
  expect(llms).not.toContain('FILL IN');
  expect(llms).not.toMatch(/\b20\d\d\b/);
});
