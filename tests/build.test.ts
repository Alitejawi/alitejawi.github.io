import { existsSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
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
  for (const date of ['2025', '2026', 'Feb', 'May']) {
    expect(html).not.toContain(date);
  }
  expect($('main ol li a').map((_, link) => $(link).attr('href')).get()).toEqual([
    '/posts/three-gam-commands-every-monday/',
    '/posts/Add_gmail_delegate_silently/',
    '/posts/Welcome/',
  ]);
  expect($('main ol li').last().text()).not.toContain('No.');
  expect($('main ol li').toArray().every((item) => /\d+ min/.test($(item).text()))).toBe(true);
});
