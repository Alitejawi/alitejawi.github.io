import { globSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// Text sizes, corners and shadows come from src/styles/tokens.css, so a restyle changes one file.
// Sizes relative to the surrounding text (em) and `inherit` are allowed; they are not on the scale.

const files = globSync('src/**/*.{astro,css}').filter((file) => !file.endsWith('tokens.css'));

/** Every value set for `property` in the site's styles, with the file it is in. Scripts are skipped. */
function declarations(property: string) {
  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    return [...source.matchAll(new RegExp(`(?<![-\\w])${property}:\\s*([^;}]+)`, 'g'))]
      .map((match) => `${file}: ${match[1].trim()}`);
  });
}

const loose = (property: string, allowed: RegExp) =>
  declarations(property).filter((declaration) => !allowed.test(declaration.split(': ').slice(1).join(': ')));

test('text sizes come from the type scale', () => {
  expect(declarations('font-size').length).toBeGreaterThan(40);
  expect(loose('font-size', /^(var\(--text-[\w-]+\)|inherit|[\d.]+em)$/)).toEqual([]);
});

test('corners come from the radius tokens', () => {
  expect(loose('border-radius', /^(0|var\(--radius-[\w-]+\))( (0|var\(--radius-[\w-]+\)))*$/)).toEqual([]);
});

test('shadows come from the shadow tokens', () => {
  expect(loose('box-shadow', /^var\(--shadow-[\w-]+\)$/)).toEqual([]);
});
