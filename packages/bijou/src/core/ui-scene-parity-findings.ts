import { segmentSurfaceText } from './components/surface-text.js';
import {
  sanitizeLayoutCoordinate,
  visibleTextSpan,
} from './ui-scene-lowering-utils.js';
import type { UiSceneSurfaceLowering } from './ui-scene-lowering.js';
import type { UiSceneParityBrowserNode } from './ui-scene-parity-browser-facts.js';
import type {
  UiSceneParityFact,
  UiSceneParityFinding,
  UiSceneParityGap,
  UiSceneParityStatus,
} from './ui-scene-parity-contract.js';
import type { UiSceneParityTerminalNode } from './ui-scene-parity-terminal-facts.js';

/** What the terminal rules give for the facts a browser element states. */
export interface UiSceneParityExpectedSpan {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly clipped: boolean;
}

export function parityFinding(
  nodeId: string,
  fact: UiSceneParityFact,
  status: UiSceneParityStatus,
  values: {
    readonly gap?: UiSceneParityGap;
    readonly terminal?: string | undefined;
    readonly browser?: string | undefined;
  },
): UiSceneParityFinding {
  return {
    nodeId,
    fact,
    status,
    ...(values.gap == null ? {} : { gap: values.gap }),
    ...(values.terminal == null ? {} : { terminal: values.terminal }),
    ...(values.browser == null ? {} : { browser: values.browser }),
  };
}

/**
 * Applies the terminal rules to browser facts: sanitize the text, truncate
 * the position, and clip the span to the target. Gives `null` when those
 * rules leave no visible cell.
 */
export function expectedTerminalSpan(
  element: UiSceneParityBrowserNode,
  target: UiSceneSurfaceLowering['targetProfile'],
): UiSceneParityExpectedSpan | null {
  const graphemes = segmentSurfaceText(element.text ?? '', 'parity witness');
  const x = coordinate(element.style.get('--bijou-x'));
  const y = coordinate(element.style.get('--bijou-y'));
  const span = visibleTextSpan(x, y, graphemes.length, target);
  if (span == null) return null;
  return {
    x: span.x,
    y,
    text: graphemes.slice(span.startOffset, span.endOffset).join(''),
    clipped: span.width < graphemes.length,
  };
}

/** A fact both outputs may carry: equal when they state the same value. */
export function sameFactFinding(
  nodeId: string,
  fact: UiSceneParityFact,
  terminal: string | undefined,
  browser: string | undefined,
): readonly UiSceneParityFinding[] {
  if (terminal == null && browser == null) return [];
  const status = terminal === browser ? 'equal' : 'mismatch';
  return [parityFinding(nodeId, fact, status, { terminal, browser })];
}

export function coordinateFinding(
  nodeId: string,
  fact: 'x' | 'y',
  drawn: number,
  browser: string | undefined,
  expected: number | undefined,
): UiSceneParityFinding {
  const terminal = String(drawn);
  if (browser === terminal) {
    return parityFinding(nodeId, fact, 'equal', { terminal, browser });
  }
  return drawn === expected
    ? parityFinding(nodeId, fact, 'gap', {
        gap: 'coordinate-normalized',
        terminal,
        browser,
      })
    : parityFinding(nodeId, fact, 'mismatch', { terminal, browser });
}

export function textFinding(
  element: UiSceneParityBrowserNode,
  drawn: UiSceneParityTerminalNode,
  expected: UiSceneParityExpectedSpan | null,
): UiSceneParityFinding {
  const values = { terminal: drawn.text, browser: element.text };
  if (drawn.text === element.text) {
    return parityFinding(element.nodeId, 'text', 'equal', values);
  }
  const gap = textGap(drawn, expected);
  return gap == null
    ? parityFinding(element.nodeId, 'text', 'mismatch', values)
    : parityFinding(element.nodeId, 'text', 'gap', { gap, ...values });
}

function textGap(
  drawn: UiSceneParityTerminalNode,
  expected: UiSceneParityExpectedSpan | null,
): UiSceneParityGap | undefined {
  if (drawn.overdrawn) return 'text-overdrawn';
  if (expected?.text !== drawn.text) return undefined;
  return expected.clipped ? 'text-clipped' : 'text-sanitized';
}

function coordinate(value: string | undefined): number {
  return sanitizeLayoutCoordinate(value == null ? undefined : Number(value));
}
