import { createHash } from 'node:crypto';

// Same rule as brain-sync's rest-day.sh in the n8n repo: each ISO week gets 1 or 2
// rest days, picked from a hash of the week, so both repos rest on the same days.

const DAY = 86_400_000;

/**
 * @param {Date} date  a UTC calendar day
 * @returns {string}   ISO week, e.g. "2026-W46"
 */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // Thursday of this week
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * @param {Date} date
 * @returns {number[]}  the week's rest weekdays, 1 = Monday .. 7 = Sunday
 */
export function restDays(date) {
  const h = createHash('sha256').update(`brain-sync-rest|${isoWeek(date)}`).digest();
  const first = (h[1] % 7) + 1;
  if (h[0] % 2 === 0) return [first];
  let second = (h[2] % 6) + 1;
  if (second >= first) second += 1;
  return [first, second];
}

/** @param {Date} date */
export function isRestDay(date) {
  return restDays(date).includes(date.getUTCDay() || 7);
}

/**
 * Days of espressos to add on a work day: today plus the rest days just before it.
 * @param {Date} date
 */
export function daysToBump(date) {
  let days = 1;
  for (let d = new Date(date.getTime() - DAY); isRestDay(d); d = new Date(d.getTime() - DAY)) {
    days += 1;
  }
  return days;
}

if (import.meta.main) {
  const arg = process.argv[2];
  const today = arg ? new Date(`${arg}T12:00:00Z`) : new Date();
  console.log(isRestDay(today) ? 'rest 0' : `work ${daysToBump(today)}`);
}
