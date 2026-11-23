import { describe, expect, it } from 'vitest';
import {
  createUiSceneBrowserDom,
  createUiSceneBrowserReceipt,
  lowerUiSceneToBrowser,
  lowerUiSceneToBrowserProof,
  type UiSceneBrowserDocument,
} from './ui-scene-browser.js';
import {
  debuggerScene,
  debuggerSceneMarkup,
  withNode,
} from './ui-scene-browser.test-support.js';
import { lowerUiSceneToTerminalProof } from './ui-scene-ir.js';

type FakeNode = FakeElement | FakeText;

interface FakeText {
  readonly data: string;
}

class FakeElement {
  readonly attributes: [string, string][] = [];
  readonly childNodes: FakeNode[] = [];

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string): void {
    this.attributes.push([name, value]);
  }

  appendChild(child: FakeNode): FakeNode {
    this.childNodes.push(child);
    return child;
  }
}

/** In-memory document: records exactly what the seam asks a host to build. */
function fakeDocument(): UiSceneBrowserDocument<FakeNode, FakeElement> & {
  readonly created: string[];
} {
  const created: string[] = [];
  return {
    created,
    createElement(tag) {
      created.push(tag);
      return new FakeElement(tag);
    },
    createTextNode(data) {
      created.push('#text');
      return { data };
    },
  };
}

function escapeText(value: string, quote: boolean): string {
  const escaped = value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return quote ? escaped.replaceAll('"', '&quot;') : escaped;
}

function serialize(node: FakeNode): string {
  if (!(node instanceof FakeElement)) return escapeText(node.data, false);
  const attributes = node.attributes
    .map(([name, value]) => ` ${name}="${escapeText(value, true)}"`)
    .join('');
  const children = node.childNodes.map(serialize).join('');
  return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
}

describe('ui-scene-ir/1 browser seam host and receipt', () => {
  it('builds the fixture through a host document port', () => {
    const host = fakeDocument();
    const { root } = lowerUiSceneToBrowser(debuggerScene);
    const element = createUiSceneBrowserDom(root, host);
    expect(serialize(element)).toBe(debuggerSceneMarkup);
    expect(host.created).toEqual([
      'div',
      'div',
      'span',
      '#text',
      'span',
      '#text',
      'span',
      '#text',
    ]);
  });

  it('creates no text node for an element without text', () => {
    const host = fakeDocument();
    const { root } = lowerUiSceneToBrowser(
      withNode(debuggerScene, 'debugger.tick', { text: undefined }),
    );
    createUiSceneBrowserDom(root, host);
    expect(host.created.filter((tag) => tag === '#text')).toHaveLength(2);
  });

  it('records the browser output in a ui-scene receipt', () => {
    const lowering = lowerUiSceneToBrowser(debuggerScene);
    const receipt = createUiSceneBrowserReceipt(debuggerScene, lowering);
    const terminal = lowerUiSceneToTerminalProof(debuggerScene).receipt;
    expect(receipt.outputs.browser?.witnessHash).toBe(lowering.markupHash);
    expect(receipt.outputs.browser?.endpointHash).toMatch(
      /^sha256:[0-9a-f]{64}$/,
    );
    expect(receipt.outputs.terminal).toBeUndefined();
    expect({ ...receipt, outputs: {} }).toEqual({ ...terminal, outputs: {} });
    expect(lowerUiSceneToBrowserProof(debuggerScene)).toEqual({
      lowering,
      receipt,
    });
  });

  it('refuses a receipt for a lowering of another scene', () => {
    const lowering = lowerUiSceneToBrowser(debuggerScene);
    const other = withNode(debuggerScene, 'debugger.tick', {
      text: { kind: 'literal', value: 'Tick 13' },
    });
    expect(() => createUiSceneBrowserReceipt(other, lowering)).toThrow(
      'Browser lowering was created for a different ui-scene-ir/1 scene.',
    );
  });

  it('changes the endpoint hash when the target profile changes', () => {
    const wide = lowerUiSceneToBrowserProof({
      ...debuggerScene,
      targetProfiles: [{ kind: 'geordi-browser', width: 1280, height: 360 }],
    });
    const base = lowerUiSceneToBrowserProof(debuggerScene);
    expect(wide.receipt.outputs.browser?.endpointHash).not.toBe(
      base.receipt.outputs.browser?.endpointHash,
    );
  });
});
