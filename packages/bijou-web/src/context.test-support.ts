import type { OutputMode } from '@flyingrobots/bijou';

export const TABLE_COLUMNS = [{ header: 'Name' }, { header: 'Status' }];
export const TABLE_ROWS = [['api', 'ready'], ['db', 'down']];

/** U+2713 CHECK MARK followed by U+FE0E, the text-presentation selector. */
const CHECK = '✓︎';

const VISUAL = {
  alert: [
    '┌───────────────────┐',
    `│ ${CHECK} Deploy complete │`,
    '└───────────────────┘',
  ].join('\n'),
  box: [
    '┌───────┐',
    '│ hello │',
    '└───────┘',
  ].join('\n'),
  table: [
    '┌──────┬────────┐',
    '│ Name │ Status │',
    '├──────┼────────┤',
    '│ api  │ ready  │',
    '│ db   │ down   │',
    '└──────┴────────┘',
  ].join('\n'),
};

export interface Golden {
  readonly alert: string;
  readonly box: string;
  readonly table: string;
}

/** Exact uncolored output of each Component in each output mode. */
export const GOLDEN: Readonly<Record<OutputMode, Golden>> = {
  interactive: VISUAL,
  static: VISUAL,
  pipe: {
    alert: '[SUCCESS] Deploy complete',
    box: 'hello',
    table: 'Name\tStatus\napi\tready\ndb\tdown',
  },
  accessible: {
    alert: 'Success: Deploy complete',
    box: 'hello',
    table: 'Row 1: Name=api, Status=ready\nRow 2: Name=db, Status=down',
  },
};

export const MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
export const LOWERED_MODES: readonly OutputMode[] = ['static', 'pipe', 'accessible'];
