import { load } from 'cheerio';
import { expect, test } from 'vitest';
import { forFeed } from '../src/lib/feed';

const page = 'https://itejawi.com/posts/example/';

test('the feed version of a note drops the styling hooks and keeps the words', () => {
  const html = forFeed(
    '<h2 id="intro" class="x">Intro</h2><p style="color:red" data-x="1">Some <strong>text</strong>.</p>' +
      '<pre class="astro-code github-dark" style="background-color:#24292e" tabindex="0" data-language="js"><code><span class="line"><span style="color:#F97583">const</span><span style="color:#E1E4E8"> a = 1;</span></span>\n<span class="line">b();</span></code></pre>',
    page,
  );
  const $ = load(html, null, false);

  expect(html).not.toMatch(/ (style|class|tabindex|data-[\w-]+)=/);
  expect($('span')).toHaveLength(0);
  expect($('pre code').text()).toBe('const a = 1;\nb();');
  expect($('h2').attr('id')).toBe('intro');
  expect($('p').html()).toBe('Some <strong>text</strong>.');
});

test('a code sample about HTML reaches the feed untouched', () => {
  // The sample's own text looks like markup with class and style attributes. It is text.
  const sample = '<div class="card" style="color: red" data-id="7"><span>hi</span></div>';
  const escaped = sample.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = forFeed(`<p>Write <code>${escaped}</code> like this:</p><pre class="astro-code"><code><span class="line">${escaped}</span></code></pre>`, page);
  const $ = load(html, null, false);

  expect($('p code').text()).toBe(sample);
  expect($('pre code').text()).toBe(sample);
});

test('links in the feed work outside the site', () => {
  const html = forFeed(
    '<p><a href="/projects/brain/">Brain</a> <a href="#the-fix">below</a> <a href="https://example.com/a">out</a> <a href="mailto:a@example.com">mail</a> <img src="/assets/img/x.png" alt="x"> <a href="//cdn.example.com/y">cdn</a></p>',
    page,
  );
  const $ = load(html, null, false);

  expect($('a').map((_, a) => $(a).attr('href')).get()).toEqual([
    'https://itejawi.com/projects/brain/',
    'https://itejawi.com/posts/example/#the-fix',
    'https://example.com/a',
    'mailto:a@example.com',
    '//cdn.example.com/y',
  ]);
  expect($('img').attr('src')).toBe('https://itejawi.com/assets/img/x.png');
  expect($('img').attr('alt')).toBe('x');
});
