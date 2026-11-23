import { createSurface, type UiAction, type UiNode, type UiSceneIr } from '@flyingrobots/bijou';
import type { SemanticSceneApp } from '@flyingrobots/bijou-tui';
import { createWebClock } from './clock.js';
import { createFakeClockHost } from './clock.test-support.js';
import { createWebContext } from './context.js';
import type { BijouDomHandle, MountBijouDomOptions } from './dom-contract.js';
import { FakeDocument, type FakeElement } from './dom-document.test-support.js';
import { mountBijouDom } from './dom-mount.js';

/** One row of a shape: node id and role. A row with a role has an action. */
export type ShapeRow = readonly [string, string | undefined];

export interface ShapesModel {
  readonly shape: number;
  /** Every value a `value` action received, in order. */
  readonly values: readonly string[];
}

export type ShapesMsg = { readonly type: 'next' } | { readonly type: 'value'; readonly value: string };

/**
 * An app that steps through fixed scene shapes. The `next` action on the
 * root group moves to the next shape. Each row with a role declares an
 * action whose string value is recorded in `values`.
 */
export function createShapesApp(shapes: readonly (readonly ShapeRow[])[]): SemanticSceneApp<ShapesModel, ShapesMsg> {
  return {
    init: () => [{ shape: 0, values: [] }, []],
    update(msg, model) {
      if (msg.type === 'next') return [{ ...model, shape: Math.min(model.shape + 1, shapes.length - 1) }, []];
      if (msg.type === 'value') return [{ ...model, values: [...model.values, msg.value] }, []];
      return [model, []];
    },
    view: () => createSurface(1, 1),
    viewScene: (model) => shapeScene(shapes[model.shape] ?? []),
    dispatchAction(action) {
      if (action.command === 'next') return { type: 'next' };
      return typeof action.value === 'string' ? { type: 'value', value: action.value } : undefined;
    },
  };
}

function shapeScene(rows: readonly ShapeRow[]): UiSceneIr {
  const nodes = rows.map(([id, role]): UiNode => ({
    id, kind: 'text', parentId: 'app', ...(role === undefined ? {} : { role }), text: { kind: 'literal', value: id },
  }));
  const actions = rows.flatMap(([id, role]): UiAction[] => role === undefined ? [] : [{ id, command: 'value', targetNodeId: id }]);
  return {
    irVersion: 'ui-scene-ir/1',
    id: 'fixture.shapes',
    sourceHash: 'sha256:fixture-shapes',
    rootNodeId: 'app',
    nodes: [{ id: 'app', kind: 'group', children: rows.map(([id]) => id) }, ...nodes],
    bindings: [],
    actions: [{ id: 'next', command: 'next', targetNodeId: 'app' }, ...actions],
    tokenUses: [],
    i18nUses: [],
    sourceMap: [],
    targetProfiles: [{ kind: 'geordi-browser', width: 640, height: 360 }],
  };
}

/** One mounted shapes app on an in-memory document. */
export interface MountedShapes {
  readonly doc: FakeDocument;
  readonly handle: BijouDomHandle<ShapesModel, ShapesMsg>;
  readonly node: (nodeId: string) => FakeElement;
  /** Invoke the `next` action, as a host that read it from the scene does. */
  readonly next: () => void;
}

export function mountShapes(
  shapes: readonly (readonly ShapeRow[])[],
  options: Omit<MountBijouDomOptions<ShapesModel>, 'ctx' | 'document'> = {},
): MountedShapes {
  const doc = new FakeDocument();
  const container = doc.createElement('main');
  doc.body.appendChild(container);
  const ctx = createWebContext({ clock: createWebClock({ host: createFakeClockHost() }) });
  const handle = mountBijouDom(createShapesApp(shapes), container, { ...options, ctx });
  return {
    doc,
    handle,
    node: (nodeId) => container.node(nodeId),
    next: () => { handle.controller.invoke({ actionId: 'next' }); },
  };
}
