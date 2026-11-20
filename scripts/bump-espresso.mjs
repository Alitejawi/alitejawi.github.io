import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Espressos added per day. The homepage chip, the About page and the workflow all follow this. */
export const PER_DAY = 3;

const DAY = 86_400_000;

/** Today's UTC calendar day, as YYYY-MM-DD. */
export function utcToday(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * The start of a UTC calendar day written as YYYY-MM-DD, in milliseconds.
 * @param {unknown} day
 * @param {string} what  names the value in the error
 */
function dayStart(day, what) {
  const time = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? Date.parse(`${day}T00:00:00Z`) : NaN;
  if (Number.isNaN(time) || utcToday(new Date(time)) !== day) {
    throw new Error(`${what} must be a calendar day written as YYYY-MM-DD`);
  }
  return time;
}

/**
 * Adds PER_DAY espressos for every UTC day after the last counted day (`through` in the file),
 * up to and including `today`, and records `today` as counted. Run twice on one day, it adds
 * nothing the second time; run after a missed day or a rest day, it adds those days too.
 * @param {string} path
 * @param {string} [today]  YYYY-MM-DD, UTC
 * @returns {{ from: number, to: number, days: number }}
 */
export function bumpEspresso(path, today = utcToday()) {
  const end = dayStart(today, 'The day to count up to');
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const from = data?.count;

  if (!Number.isInteger(from) || from < 0) {
    throw new Error('Espresso count must be a non-negative integer');
  }

  const days = Math.max(0, Math.round((end - dayStart(data.through, 'The last counted day')) / DAY));
  if (days === 0) return { from, to: from, days };

  const to = from + PER_DAY * days;
  writeFileSync(path, `${JSON.stringify({ count: to, through: today }, null, 2)}\n`);
  return { from, to, days };
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
    // Optional argument: the UTC day to count up to, as YYYY-MM-DD. Default: today.
    const path = fileURLToPath(new URL('../src/data/espresso.json', import.meta.url));
    const { from, to } = bumpEspresso(path, process.argv[2] ?? utcToday());
    // Only the number added, for the workflow's commit message; 0 when today is already counted.
    console.log(to - from);
  } catch (error) {
    console.error(`Failed to bump espresso count: ${error.message}`);
    process.exitCode = 1;
  }
}
