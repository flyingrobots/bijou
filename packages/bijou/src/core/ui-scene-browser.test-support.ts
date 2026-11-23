import type { UiSceneIr } from './ui-scene-contract.js';

/** Deterministic debugger-shaped `ui-scene-ir/1` fixture for the browser seam. */
export const debuggerScene: UiSceneIr = {
  irVersion: 'ui-scene-ir/1',
  id: 'fixture.debugger-scene',
  sourceHash: 'sha256:fixture-debugger-scene',
  rootNodeId: 'debugger',
  nodes: [
    {
      id: 'debugger',
      kind: 'group',
      role: 'region',
      component: 'DebuggerPane',
      children: ['debugger.title', 'debugger.tick', 'debugger.step'],
      layout: { x: 0, y: 0, width: 32, height: 3 },
    },
    {
      id: 'debugger.title',
      kind: 'text',
      role: 'heading',
      parentId: 'debugger',
      layout: { x: 0, y: 0 },
      text: { kind: 'i18n', key: 'debugger.title', fallback: 'Debugger' },
      style: { fg: { token: 'semantic.title.fg' }, modifiers: ['bold'] },
    },
    {
      id: 'debugger.tick',
      kind: 'text',
      parentId: 'debugger',
      layout: { x: 0, y: 1 },
      text: { kind: 'literal', value: 'Tick 12 <paused> & "held"' },
    },
    {
      id: 'debugger.step',
      kind: 'text',
      parentId: 'debugger',
      layout: { x: 2, y: 2 },
      text: { kind: 'literal', value: 'Step' },
      style: {
        fg: { token: 'semantic.action.fg' },
        bg: { token: 'semantic.action.bg' },
      },
      actions: ['debugger.step'],
    },
  ],
  bindings: [
    {
      id: 'debugger.tick.value',
      targetNodeId: 'debugger.tick',
      targetProperty: 'text',
      source: { kind: 'state', path: 'debugger.tick' },
    },
  ],
  actions: [
    {
      id: 'debugger.step',
      command: 'debugger.step',
      keybindings: ['s'],
      targetNodeId: 'debugger.step',
      label: { kind: 'literal', value: 'Step' },
    },
  ],
  tokenUses: [
    { nodeId: 'debugger.title', slot: 'fg', token: 'semantic.title.fg' },
    { nodeId: 'debugger.step', slot: 'fg', token: 'semantic.action.fg' },
    { nodeId: 'debugger.step', slot: 'bg', token: 'semantic.action.bg' },
  ],
  i18nUses: [{ nodeId: 'debugger.title', key: 'debugger.title' }],
  sourceMap: [{ nodeId: 'debugger.tick', source: 'fixture.debugger:3:1' }],
  targetProfiles: [
    { kind: 'bijou-terminal', cols: 32, rows: 3 },
    { kind: 'geordi-browser', width: 640, height: 360 },
  ],
  portability: { level: 'portable' },
};

/** The exact markup the browser seam must emit for {@link debuggerScene}. */
export const debuggerSceneMarkup = [
  '<div data-bijou-scene-id="fixture.debugger-scene"',
  ' data-bijou-ir-version="ui-scene-ir/1"',
  ' data-bijou-endpoint="ui-scene-browser/1"',
  ' data-bijou-source-hash="sha256:fixture-debugger-scene"',
  ' data-bijou-target="geordi-browser"',
  ' data-bijou-target-width="640" data-bijou-target-height="360">',
  '<div data-bijou-node-id="debugger" data-bijou-node-kind="group"',
  ' data-bijou-role="region" data-bijou-component="DebuggerPane"',
  ' style="--bijou-x:0;--bijou-y:0;--bijou-width:32;--bijou-height:3">',
  '<span data-bijou-node-id="debugger.title" data-bijou-node-kind="text"',
  ' data-bijou-role="heading" data-bijou-i18n-key="debugger.title"',
  ' data-bijou-fg-token="semantic.title.fg" data-bijou-modifiers="bold"',
  ' style="--bijou-x:0;--bijou-y:0">Debugger</span>',
  '<span data-bijou-node-id="debugger.tick" data-bijou-node-kind="text"',
  ' data-bijou-binding="debugger.tick.value"',
  ' data-bijou-source="fixture.debugger:3:1"',
  ' style="--bijou-x:0;--bijou-y:1">',
  'Tick 12 &lt;paused&gt; &amp; "held"</span>',
  '<span data-bijou-node-id="debugger.step" data-bijou-node-kind="text"',
  ' data-bijou-action="debugger.step"',
  ' data-bijou-fg-token="semantic.action.fg"',
  ' data-bijou-bg-token="semantic.action.bg"',
  ' style="--bijou-x:2;--bijou-y:2">Step</span>',
  '</div></div>',
].join('');

/** Replaces one fixture node by id, leaving every other fact untouched. */
export function withNode(
  scene: UiSceneIr,
  nodeId: string,
  patch: Partial<UiSceneIr['nodes'][number]>,
): UiSceneIr {
  return {
    ...scene,
    nodes: scene.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...patch } : node,
    ),
  };
}
