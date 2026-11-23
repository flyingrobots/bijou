import type { UiSceneSurfaceLowering } from './ui-scene-lowering.js';
import type { UiSceneParityBrowserNode } from './ui-scene-parity-browser-facts.js';
import type {
  UiSceneParityFact,
  UiSceneParityFinding,
} from './ui-scene-parity-contract.js';
import {
  coordinateFinding,
  expectedTerminalSpan,
  parityFinding,
  sameFactFinding,
  textFinding,
  type UiSceneParityExpectedSpan,
} from './ui-scene-parity-findings.js';
import type { UiSceneParityTerminalNode } from './ui-scene-parity-terminal-facts.js';

type FactPair = readonly [
  fact: UiSceneParityFact,
  terminal: string | undefined,
  browser: string | undefined,
];

/** The findings for one browser node element, in a fixed fact order. */
export function parityNodeFindings(
  element: UiSceneParityBrowserNode,
  drawn: UiSceneParityTerminalNode | undefined,
  target: UiSceneSurfaceLowering['targetProfile'],
): readonly UiSceneParityFinding[] {
  const expected = expectedTerminalSpan(element, target);
  return [
    ...(drawn == null
      ? [undrawnFinding(element, expected)]
      : drawnFindings(element, drawn, expected)),
    ...browserOnlyFindings(element),
  ];
}

function undrawnFinding(
  element: UiSceneParityBrowserNode,
  expected: UiSceneParityExpectedSpan | null,
): UiSceneParityFinding {
  const browser = element.kind;
  if (element.kind === 'group') {
    return parityFinding(element.nodeId, 'node', 'gap', {
      gap: 'group-not-drawn',
      browser,
    });
  }
  return expected == null
    ? parityFinding(element.nodeId, 'node', 'gap', {
        gap: 'text-not-visible',
        browser,
      })
    : parityFinding(element.nodeId, 'node', 'mismatch', { browser });
}

function drawnFindings(
  element: UiSceneParityBrowserNode,
  drawn: UiSceneParityTerminalNode,
  expected: UiSceneParityExpectedSpan | null,
): readonly UiSceneParityFinding[] {
  const { nodeId, attributes, style } = element;
  const { entry } = drawn;
  const shared: readonly FactPair[] = [
    ['source', entry.source, attributes.get('data-bijou-source')],
    ['i18n-key', entry.textKey, attributes.get('data-bijou-i18n-key')],
    ['fg-token', entry.fgToken, attributes.get('data-bijou-fg-token')],
    ['bg-token', entry.bgToken, attributes.get('data-bijou-bg-token')],
  ];
  // Cells that a later node drew over no longer state this node's style.
  const cells: readonly FactPair[] = drawn.overdrawn
    ? []
    : [
        ['fg-color', drawn.fgColor, style.get('color')],
        ['bg-color', drawn.bgColor, style.get('background-color')],
        ['modifiers', drawn.modifiers, attributes.get('data-bijou-modifiers')],
      ];
  return [
    coordinateFinding(nodeId, 'x', entry.x, style.get('--bijou-x'), expected?.x),
    coordinateFinding(nodeId, 'y', entry.y, style.get('--bijou-y'), expected?.y),
    textFinding(element, drawn, expected),
    ...[...shared, ...cells].flatMap(([fact, terminal, browser]) =>
      sameFactFinding(nodeId, fact, terminal, browser),
    ),
  ];
}

/** Facts the terminal output has no place for. */
function browserOnlyFindings(
  element: UiSceneParityBrowserNode,
): readonly UiSceneParityFinding[] {
  const { attributes, style } = element;
  const facts: readonly (readonly [UiSceneParityFact, string | undefined])[] = [
    ['role', attributes.get('data-bijou-role')],
    ['component', attributes.get('data-bijou-component')],
    ['action', attributes.get('data-bijou-action')],
    ['binding', attributes.get('data-bijou-binding')],
    ['border-token', attributes.get('data-bijou-border-token')],
    ['checked', attributes.get('data-bijou-checked')],
    ['width', style.get('--bijou-width')],
    ['height', style.get('--bijou-height')],
  ];
  return facts.flatMap(([fact, browser]) =>
    browser == null
      ? []
      : [
          parityFinding(element.nodeId, fact, 'gap', {
            gap: 'browser-only-fact',
            browser,
          }),
        ],
  );
}
