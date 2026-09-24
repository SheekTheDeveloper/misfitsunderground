export type Period = { start: Date; end: Date };

/** Current calendar month in UTC. `end` is the instant the board resets. */
export function currentMonthlyPeriod(now = new Date()): Period {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}
