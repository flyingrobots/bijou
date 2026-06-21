const RENDER_SLOT_FIXTURES: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  AppShell: { navigation: 'Docs nav', content: 'Blocks guide', inspector: 'Current selection', status: 'Ready', overlays: ['Help'] },
  ReaderSurface: { content: 'Readable block documentation.', navigation: 'Docs nav', outline: ['Intro', 'Lowering'] },
  InspectorPanel: { selection: 'ReaderSurface', details: ['schema-aware', 'command-aware'], actions: ['reveal source'] },
  InlineStatusBlock: { label: 'docs', status: 'ok', message: 'synced' },
  InFlowStatusBlock: { severity: 'warning', source: 'docs', message: 'inventory stale', action: 'run docs:inventory' },
  TransientOverlayBlock: { priority: 'normal', message: 'Saved DOGFOOD route', dismiss: 'Esc dismisses' },
  ActivityStreamBlock: { events: ['10:41 tests passed', '10:42 PR opened'], selected: '10:41 tests passed' },
  ShortcutCueBlock: { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' },
  ProgressIndicatorBlock: { label: 'Install packages', value: '3', total: '5', percent: '60%' },
  FramedGroupBlock: { title: 'Release Checks', items: ['tests green', 'docs updated', 'PR linked'], selected: 'tests green', mode: 'review' },
  ExplainabilityWalkthroughBlock: { title: 'Why this changed', steps: ['input changed', 'constraint tightened', 'preview re-rendered'], evidence: 'DF-040 playback', decision: 'keep grouped proof visible', nextStep: 'open lower-mode output' },
  FormattedDocumentBlock: { heading: 'Blocks document', body: 'Use prose for persistent product truth.', callout: 'Lower modes keep the same heading and body facts.', code: 'block: FormattedDocumentBlock' },
  LinkDestinationBlock: { label: 'DOGFOOD.md', destination: 'docs/DOGFOOD.md', kind: 'docs', status: 'available' },
  DividerBlock: { label: 'Release Evidence', style: 'rule', density: 'compact' },
  TextEntryBlock: { field: 'Search docs', value: 'table', placeholder: 'type a query', validation: '4 results', results: 4 },
  SingleChoiceBlock: { label: 'Output mode', options: ['interactive', 'pipe', 'accessible'], selected: 'pipe', mode: 'radio', validation: 'available' },
  MultipleChoiceBlock: { label: 'Release proof', checked: ['lint', 'tests'], unchecked: ['screenshots'], selected: 'lint; tests', validation: '2 of 3 complete' },
  BinaryDecisionBlock: { label: 'Merge gate', selected: 'yes', consequence: 'admin merge', confirmation: 'CI green', disabledReason: 'none' },
  PeerNavigationBlock: { previous: 'Architecture', current: 'Blocks', next: 'Method', route: 'docs/blocks', status: 'available' },
  ProgressiveDisclosureBlock: { label: 'Advanced options', state: 'closed', hiddenCount: 6, summary: '6 options hidden', details: ['debug traces', 'layout facts'] },
  PathProgressBlock: { path: ['Setup', 'Blocks', 'Preview'], current: 'Blocks', step: 2, total: 3, status: 'current' },
  BrandEmphasisBlock: { brand: 'BIJOU', tagline: 'Terminal-native app blocks', decoration: 'accent rule', role: 'nonessential', selected: 'BIJOU' },
  ModeAwarePrimitiveBlock: { primitive: 'metric badge', fact: 'latency-ms', value: 42, status: 'good', modeContract: 'visual and pipe', selected: 'metric badge' },
  DenseComparisonBlock: { title: 'Compare packages', metric: 'tests', left: '1820', right: '640', delta: '+12', selected: 'tests' },
  HierarchyBlock: { root: 'docs/', nodes: ['design/', 'DX-031.md', 'METHOD.md'], selected: 'design/', parent: 'docs/', depth: 1, expanded: 'true' },
  ExplorationListBlock: { title: 'Explore components', facet: 'input', items: ['TextEntry field input', 'SingleChoice radio/select'], selected: 'TextEntry', preview: 'field input' },
  TemporalDependencyBlock: { title: 'Timeline', events: ['09:00 build', '09:05 test', '09:10 publish'], dependency: 'publish waits for test', selected: 'publish', dependsOn: 'test' },
};

function renderSlotsFor(blockName: string): Readonly<Record<string, unknown>> {
  const slots = RENDER_SLOT_FIXTURES[blockName];
  if (slots == null) throw new Error(`unknown standard block ${blockName}`);
  return slots;
}

export { renderSlotsFor };
