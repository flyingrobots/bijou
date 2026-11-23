import type { UiSceneBrowserElement } from './ui-scene-browser.js';
import type {
  UiSceneParityComparison,
  UiSceneParityFact,
  UiSceneParityFinding,
  UiSceneParityGap,
  UiSceneParityWitness,
} from './ui-scene-parity.js';

/** A finding where the terminal and the browser output state one value. */
export function equal(
  nodeId: string,
  fact: UiSceneParityFact,
  value: string,
): UiSceneParityFinding {
  return { nodeId, fact, status: 'equal', terminal: value, browser: value };
}

/** A finding for a fact that only the browser output carries. */
export function browserOnly(
  nodeId: string,
  fact: UiSceneParityFact,
  browser: string,
): UiSceneParityFinding {
  return { nodeId, fact, status: 'gap', gap: 'browser-only-fact', browser };
}

/** The exact findings the witness must report for the debugger fixture. */
export const debuggerSceneFindings: readonly UiSceneParityFinding[] = [
  {
    nodeId: 'debugger',
    fact: 'node',
    status: 'gap',
    gap: 'group-not-drawn',
    browser: 'group',
  },
  browserOnly('debugger', 'role', 'region'),
  browserOnly('debugger', 'component', 'DebuggerPane'),
  browserOnly('debugger', 'width', '32'),
  browserOnly('debugger', 'height', '3'),
  equal('debugger.title', 'x', '0'),
  equal('debugger.title', 'y', '0'),
  equal('debugger.title', 'text', 'Debugger'),
  equal('debugger.title', 'i18n-key', 'debugger.title'),
  equal('debugger.title', 'fg-token', 'semantic.title.fg'),
  equal('debugger.title', 'modifiers', 'bold'),
  browserOnly('debugger.title', 'role', 'heading'),
  equal('debugger.tick', 'x', '0'),
  equal('debugger.tick', 'y', '1'),
  equal('debugger.tick', 'text', 'Tick 12 <paused> & "held"'),
  equal('debugger.tick', 'source', 'fixture.debugger:3:1'),
  browserOnly('debugger.tick', 'binding', 'debugger.tick.value'),
  equal('debugger.step', 'x', '2'),
  equal('debugger.step', 'y', '2'),
  equal('debugger.step', 'text', 'Step'),
  equal('debugger.step', 'fg-token', 'semantic.action.fg'),
  equal('debugger.step', 'bg-token', 'semantic.action.bg'),
  browserOnly('debugger.step', 'action', 'debugger.step'),
];

/** Narrows a witness to a comparison, or fails with the refusals. */
export function compared(
  witness: UiSceneParityWitness,
): UiSceneParityComparison {
  if (witness.status === 'compared') return witness;
  throw new Error(`Expected a comparison: ${JSON.stringify(witness.refusals)}`);
}

export function findingFor(
  witness: UiSceneParityWitness,
  nodeId: string,
  fact: UiSceneParityFact,
): UiSceneParityFinding | undefined {
  return compared(witness).findings.find(
    (finding) => finding.nodeId === nodeId && finding.fact === fact,
  );
}

export function mismatches(
  witness: UiSceneParityWitness,
): readonly UiSceneParityFinding[] {
  return compared(witness).findings.filter(
    (finding) => finding.status === 'mismatch',
  );
}

export function gaps(
  witness: UiSceneParityWitness,
): readonly (UiSceneParityGap | undefined)[] {
  return compared(witness)
    .findings.filter((finding) => finding.status === 'gap')
    .map((finding) => finding.gap);
}

/** Rewrites one node element of a lowered tree, leaving the rest as it is. */
export function withElement(
  element: UiSceneBrowserElement,
  nodeId: string,
  rewrite: (element: UiSceneBrowserElement) => UiSceneBrowserElement,
): UiSceneBrowserElement {
  const isNode = element.attributes.some(
    (entry) => entry.name === 'data-bijou-node-id' && entry.value === nodeId,
  );
  const next: UiSceneBrowserElement = {
    ...element,
    children: element.children.map((child) =>
      withElement(child, nodeId, rewrite),
    ),
  };
  return isNode ? rewrite(next) : next;
}

/** Replaces one attribute value on an element. */
export function withAttribute(
  element: UiSceneBrowserElement,
  name: string,
  value: string,
): UiSceneBrowserElement {
  return {
    ...element,
    attributes: element.attributes.map((entry) =>
      entry.name === name ? { name, value } : entry,
    ),
  };
}

export function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  const entries: unknown[] = Object.values(value);
  for (const entry of entries) deepFreeze(entry);
  return Object.freeze(value);
}
