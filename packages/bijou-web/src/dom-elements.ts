import type { UiSceneBrowserAttribute, UiSceneBrowserElement } from '@flyingrobots/bijou';
import {
  parseUiSceneActionAttribute,
  UI_SCENE_ACTION_ATTRIBUTE,
  UI_SCENE_NODE_ID_ATTRIBUTE,
} from '@flyingrobots/bijou-tui';

/** How the host renders a node: a native control or a plain element. */
export type DomHostKind = 'button' | 'input' | 'plain';

/** The element that the host builds for one lowered node. */
export interface DomHostSpec {
  readonly kind: DomHostKind;
  readonly tag: string;
  readonly nodeId: string;
  /** The node's action ids, in `data-bijou-action` order. */
  readonly actionIds: readonly string[];
  /** The lowered attributes, then the attributes the host adds. */
  readonly attributes: readonly UiSceneBrowserAttribute[];
}

/** Scene roles that the host writes as the ARIA `role` of a plain element. */
const ARIA_ROLES: ReadonlySet<string> = new Set(['alert', 'group', 'log', 'region', 'status', 'toolbar']);

function attribute(element: UiSceneBrowserElement, name: string): string | undefined {
  return element.attributes.find((candidate) => candidate.name === name)?.value;
}

function hostKind(role: string | undefined, element: UiSceneBrowserElement): DomHostKind {
  if (role === 'button' || role === 'switch') return 'button';
  if (role === 'textbox' && element.children.length === 0) return 'input';
  return 'plain';
}

/**
 * Choose the host element for a lowered node from its `data-bijou-role`.
 *
 * The browser seam maps no role to ARIA, so the host does: `button` and
 * `switch` become `<button type="button">`, a `textbox` without children
 * becomes `<input type="text">`, and every other node keeps the seam's `div`
 * or `span`. A plain element with an action gets `tabindex="0"`, and a plain
 * element whose role is in a short list gets that ARIA `role`.
 */
export function hostSpec(element: UiSceneBrowserElement): DomHostSpec {
  const nodeId = attribute(element, UI_SCENE_NODE_ID_ATTRIBUTE);
  if (nodeId === undefined) {
    throw new Error(`A lowered element has no ${UI_SCENE_NODE_ID_ATTRIBUTE} attribute.`);
  }
  const role = attribute(element, 'data-bijou-role');
  const actionIds = parseUiSceneActionAttribute(attribute(element, UI_SCENE_ACTION_ATTRIBUTE) ?? '');
  const kind = hostKind(role, element);
  const added: UiSceneBrowserAttribute[] = [];
  if (kind === 'button') added.push({ name: 'type', value: 'button' });
  const checked = attribute(element, 'data-bijou-checked');
  if (role === 'switch' && checked !== undefined) {
    added.push({ name: 'role', value: 'switch' }, { name: 'aria-checked', value: checked });
  }
  if (kind === 'input') added.push({ name: 'type', value: 'text' });
  if (kind === 'plain' && actionIds.length > 0) added.push({ name: 'tabindex', value: '0' });
  if (kind === 'plain' && role !== undefined && ARIA_ROLES.has(role)) added.push({ name: 'role', value: role });
  return {
    kind,
    tag: kind === 'plain' ? element.tag : kind,
    nodeId,
    actionIds,
    attributes: [...element.attributes, ...added],
  };
}
