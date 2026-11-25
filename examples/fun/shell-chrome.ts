// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import type { KeyMsg } from '@flyingrobots/bijou-tui';
import type { DemoEntry, Session } from './contract.js';

interface Run {
  readonly text: string;
  readonly fg?: string;
  readonly bold?: boolean;
}

function writeRuns(width: number, ctx: BijouContext, runs: readonly Run[]): Surface {
  const surface = createSurface(width, 1);
  let x = 0;
  for (const run of runs) {
    for (const char of run.text) {
      if (x >= width) return surface;
      surface.set(x, 0, { char, empty: false, fg: run.fg ?? ctx.semantic('muted').hex, modifiers: run.bold === true ? ['bold'] : [] });
      x += 1;
    }
  }
  return surface;
}

/** One row: every demo by number and name, the current one in the accent colour. */
export function headerRow(ctx: BijouContext, entries: readonly DemoEntry[], index: number, width: number): Surface {
  const runs = entries.flatMap((entry, i): Run[] => {
    const label = `${i === index ? '▸' : ' '} ${String(i + 1)} ${entry.name}  `;
    return [i === index ? { text: label, fg: ctx.semantic('accent').hex, bold: true } : { text: label }];
  });
  return writeRuns(width, ctx, runs);
}

/** One row: what the demo is, the keys it answers to, and the host's own keys when it has any. */
export function footerRow(ctx: BijouContext, entry: DemoEntry, paused: boolean, width: number, hostKeys = ''): Surface {
  return writeRuns(width, ctx, [
    { text: entry.description, fg: ctx.semantic('primary').hex },
    { text: `  ·  ${entry.keys}${hostKeys === '' ? '' : `  ·  ${hostKeys}`}${paused ? '  ·  PAUSED' : ''}` },
  ]);
}

/** The key a demo hears while it takes text: a shifted letter keeps its shift, so `B` is not `b`. */
export function typed(msg: KeyMsg): string {
  return msg.shift && /^[a-z]$/u.test(msg.key) ? `shift+${msg.key}` : msg.key;
}

/** The pane of a demo whose `view` threw: the demo's name and what it said, so the header and footer stay usable. */
export function failurePane(ctx: BijouContext, entry: DemoEntry, error: unknown, width: number, height: number): Surface {
  const reason = error instanceof Error ? error.message : String(error);
  const pane = createSurface(width, height);
  pane.blit(writeRuns(width, ctx, [{ text: `${entry.name} failed: ${reason}`, fg: ctx.semantic('error').hex, bold: true }]), 0, 0);
  return pane;
}

/** The demo's frame, or the failure that stopped it: a demo that throws does not take its host down. */
export function paintPane(ctx: BijouContext, entry: DemoEntry, session: Session, width: number, height: number): Surface {
  try {
    return session.view(width, height, ctx);
  } catch (error) {
    return failurePane(ctx, entry, error, width, height);
  }
}
