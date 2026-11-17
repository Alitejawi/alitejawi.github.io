import { expect, test } from 'vitest';
import { renderCard, titleSize } from '../src/lib/og-card';

const card = { kicker: 'Field note No. 09', chip: 'Web', meta: '4 min read' };

test('a share image is a 1200 x 630 PNG', async () => {
  const png = Buffer.from(await renderCard({ ...card, title: 'A plain title' }));

  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test('longer titles get smaller type', () => {
  expect(titleSize('Welcome')).toBeGreaterThan(titleSize('A delete lock for AI agents: parsing shell commands in a PreToolUse hook'));
  expect(titleSize('x'.repeat(200))).toBe(48);
});

test('a title with a character the font cannot draw stops the build, and names it', async () => {
  // Without this the image shows an empty box where the character should be.
  await expect(renderCard({ ...card, title: 'Shipping it 🚀' })).rejects.toThrow(/Shipping it/);
  await expect(renderCard({ ...card, title: '日本語のタイトル' })).rejects.toThrow(/cannot draw/);
  await expect(renderCard({ ...card, title: 'Curly “quotes”, a dash – and an arrow → are fine' })).resolves.toBeDefined();
});
