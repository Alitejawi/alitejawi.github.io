import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} path
 * @param {number} [by=2]
 * @returns {{ from: number, to: number }}
 */
export function bumpEspresso(path, by = 2) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const from = data?.count;

  if (!Number.isInteger(from) || from < 0) {
    throw new Error('Espresso count must be a non-negative integer');
  }

  const to = from + by;
  writeFileSync(path, `${JSON.stringify({ count: to }, null, 2)}\n`);
  return { from, to };
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatCount(n) {
  return n.toLocaleString('en-US');
}

if (import.meta.main) {
  try {
    const path = fileURLToPath(new URL('../src/data/espresso.json', import.meta.url));
    const { from, to } = bumpEspresso(path);
    console.log(`${from} -> ${to}`);
  } catch (error) {
    console.error(`Failed to bump espresso count: ${error.message}`);
    process.exitCode = 1;
  }
}
