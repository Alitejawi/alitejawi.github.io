import { existsSync } from 'node:fs';
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
