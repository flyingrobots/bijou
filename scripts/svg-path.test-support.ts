import { parsePathPolygons } from '../examples/docs/svg-path.js';

/**
 * Parse with a step budget the test can check: a parser that consumes input on
 * every iteration needs at most one step per input character. Exceeding the
 * budget throws, so the very bug under test (a non-consuming loop) fails fast
 * instead of hanging the run.
 */
export function parseBounded(path: string): ReturnType<typeof parsePathPolygons> {
  const budget = path.length + 1;
  return parsePathPolygons(path, (step) => {
    if (step > budget) throw new Error(`STALL: step ${String(step)} exceeds budget ${String(budget)}`);
  });
}
