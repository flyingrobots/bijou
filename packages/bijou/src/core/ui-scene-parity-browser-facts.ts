import type { UiSceneBrowserElement } from './ui-scene-browser-contract.js';

/** The facts one node element states, read back from the lowered tree. */
export interface UiSceneParityBrowserNode {
  readonly nodeId: string;
  readonly kind: string | undefined;
  readonly text: string | undefined;
  readonly attributes: ReadonlyMap<string, string>;
  readonly style: ReadonlyMap<string, string>;
}

/** Every node element under `root`, in tree order. */
export function browserParityNodes(
  root: UiSceneBrowserElement,
): readonly UiSceneParityBrowserNode[] {
  const nodes: UiSceneParityBrowserNode[] = [];
  collect(root, nodes);
  return nodes;
}

function collect(
  element: UiSceneBrowserElement,
  nodes: UiSceneParityBrowserNode[],
): void {
  const attributes = new Map(
    element.attributes.map((entry) => [entry.name, entry.value]),
  );
  const nodeId = attributes.get('data-bijou-node-id');
  if (nodeId != null) {
    nodes.push({
      nodeId,
      kind: attributes.get('data-bijou-node-kind'),
      text: element.text,
      attributes,
      style: styleDeclarations(attributes.get('style')),
    });
  }
  for (const child of element.children) collect(child, nodes);
}

function styleDeclarations(
  style: string | undefined,
): ReadonlyMap<string, string> {
  const declarations = new Map<string, string>();
  for (const declaration of (style ?? '').split(';')) {
    const colon = declaration.indexOf(':');
    if (colon <= 0) continue;
    declarations.set(
      declaration.slice(0, colon),
      declaration.slice(colon + 1),
    );
  }
  return declarations;
}
