import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} path
 * @param {number} [by=3]
 * @returns {{ from: number, to: number }}
 */
export function bumpEspresso(path, by = 3) {
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
    // Optional argument: days to cover (rest days skip the run, the next run catches up).
    const days = Number(process.argv[2] ?? 1);
    if (!Number.isInteger(days) || days < 1) {
      throw new Error('Days must be a positive integer');
    }
    const path = fileURLToPath(new URL('../src/data/espresso.json', import.meta.url));
    const { from, to } = bumpEspresso(path, 3 * days);
    console.log(`${from} -> ${to}`);
  } catch (error) {
    console.error(`Failed to bump espresso count: ${error.message}`);
    process.exitCode = 1;
  }
}
