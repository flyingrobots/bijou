import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';

// What the showcase takes from bench/src/soak-browser.ts. The bench is compiled
// by the repository's own tsconfig; this describes it to the showcase's stricter
// one, which would otherwise read the whole bench.
export interface BrowserSoak {
  readonly app: (ctx: BijouContext) => App<unknown, unknown>;
  readonly lines: () => readonly string[];
}
export function createBrowserSoak(search: string, scenarioContext: () => BijouContext): BrowserSoak;
