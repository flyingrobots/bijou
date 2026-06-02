import {
  commandIntent,
  defineBlock,
  defineBlockSchemaAdapter,
  defineDataRequirement,
  defineSchemaBlock,
  defineViewData,
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderInput,
  type BlockRenderResult,
  type BlockSchemaAdapter,
  type BlockSchemaResult,
  type OutputMode,
  type SchemaBoundBlockDefinition,
} from '@flyingrobots/bijou';

const DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND: unique symbol = Symbol('DogfoodBlockRegistryEntry');
const DOGFOOD_BLOCK_REGISTRY_BRAND: unique symbol = Symbol('DogfoodBlockRegistry');

export const DOGFOOD_BLOCK_PACKAGE = '@flyingrobots/bijou-dogfood';
const DOGFOOD_BLOCK_MODES: readonly OutputMode[] = Object.freeze([
  'interactive',
  'static',
  'pipe',
  'accessible',
]);
const DOGFOOD_BLOCK_ROLES: readonly DogfoodBlockRole[] = Object.freeze([
  'app-shell',
  'title',
  'navigation',
  'article',
  'search',
  'notifications',
  'diagnostics',
  'help',
  'commands',
  'settings',
  'inspector',
  'preview',
  'footer',
  'workbench',
  'fixture',
]);

export type DogfoodBlockDefinition = BlockDefinition<never, unknown>;

export type DogfoodBlockRole =
  | 'app-shell'
  | 'title'
  | 'navigation'
  | 'article'
  | 'search'
  | 'notifications'
  | 'diagnostics'
  | 'help'
  | 'commands'
  | 'settings'
  | 'inspector'
  | 'preview'
  | 'footer'
  | 'workbench'
  | 'fixture';

export interface DogfoodBlockRegistryEntryInput {
  readonly block: DogfoodBlockDefinition;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export interface DogfoodBlockRegistryEntry {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]: true;
  readonly block: DogfoodBlockDefinition;
  readonly blockName: string;
  readonly packageName: string;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags: readonly string[];
}

export class DogfoodBlockRegistry {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]!: true;
  readonly #entries: readonly DogfoodBlockRegistryEntry[];
  readonly #entriesByBlockKey: ReadonlyMap<string, DogfoodBlockRegistryEntry>;
  readonly #entriesBySurfaceId: ReadonlyMap<string, DogfoodBlockRegistryEntry>;

  constructor(entries: readonly DogfoodBlockRegistryEntry[]) {
    if (!Array.isArray(entries)) {
      throw new Error('dogfood block registry: entries must be an array');
    }

    Object.defineProperty(this, DOGFOOD_BLOCK_REGISTRY_BRAND, { value: true });

    const entriesByBlockKey = new Map<string, DogfoodBlockRegistryEntry>();
    const entriesBySurfaceId = new Map<string, DogfoodBlockRegistryEntry>();
    const normalizedEntries: DogfoodBlockRegistryEntry[] = [];

    entries.forEach((entry, index) => {
      if (!isDogfoodBlockRegistryEntry(entry)) {
        throw new Error(
          `dogfood block registry: entry at index ${index} was not created by dogfoodBlockRegistryEntry()`,
        );
      }

      const blockKey = dogfoodBlockKey(entry.packageName, entry.blockName);
      if (entriesByBlockKey.has(blockKey)) {
        throw new Error(`dogfood block registry: duplicate block ${blockKey}`);
      }
      if (entriesBySurfaceId.has(entry.surfaceId)) {
        throw new Error(`dogfood block registry: duplicate surface id ${entry.surfaceId}`);
      }

      entriesByBlockKey.set(blockKey, entry);
      entriesBySurfaceId.set(entry.surfaceId, entry);
      normalizedEntries.push(entry);
    });

    this.#entries = Object.freeze(normalizedEntries);
    this.#entriesByBlockKey = entriesByBlockKey;
    this.#entriesBySurfaceId = entriesBySurfaceId;
    Object.freeze(this);
  }

  entries(): readonly DogfoodBlockRegistryEntry[] {
    return Object.freeze([...this.#entries]);
  }

  blocks(): readonly DogfoodBlockDefinition[] {
    return Object.freeze(this.#entries.map((entry) => entry.block));
  }

  blockNames(): readonly string[] {
    return Object.freeze(this.#entries.map((entry) => entry.blockName));
  }

  surfaceIds(): readonly string[] {
    return Object.freeze(this.#entries.map((entry) => entry.surfaceId));
  }

  roles(): readonly DogfoodBlockRole[] {
    const roles = new Set<DogfoodBlockRole>();
    this.#entries.forEach((entry) => roles.add(entry.role));
    return Object.freeze([...roles]);
  }

  forSurface(surfaceId: string): DogfoodBlockRegistryEntry | undefined {
    return this.#entriesBySurfaceId.get(normalizeRequiredText({
      scope: 'dogfood block registry',
      field: 'surfaceId',
      value: surfaceId,
    }));
  }

  forBlock(blockName: string, packageName = DOGFOOD_BLOCK_PACKAGE): DogfoodBlockRegistryEntry | undefined {
    return this.#entriesByBlockKey.get(dogfoodBlockKey(
      normalizeRequiredText({
        scope: 'dogfood block registry',
        field: 'packageName',
        value: packageName,
      }),
      normalizeRequiredText({
        scope: 'dogfood block registry',
        field: 'blockName',
        value: blockName,
      }),
    ));
  }

  with(entry: DogfoodBlockRegistryEntry): DogfoodBlockRegistry {
    return new DogfoodBlockRegistry([...this.#entries, entry]);
  }
}

export interface StorybookWorkbenchBlockConfig {
  readonly storyCount?: number;
  readonly selectedStoryLabel?: string;
  readonly profileLabel?: string;
}

export interface TitleScreenBlockConfig {
  readonly title?: string;
  readonly subtitle?: string;
}

export interface NavigationListBlockConfig {
  readonly itemCount?: number;
  readonly activeLabel?: string;
  readonly activeItemId?: string;
  readonly items?: readonly NavigationListBlockItem[];
}

export interface NavigationListBlockItem {
  readonly id: string;
  readonly label: string;
  readonly depth?: number;
}

export interface DocumentationArticleBlockConfig {
  readonly title?: string;
  readonly body?: string;
  readonly headingCount?: number;
}

export interface DogfoodDocsSurfaceSearchState {
  readonly query: string;
  readonly hitCount: number;
}

export interface DogfoodDocsSurfaceProofArtifact {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
}

export interface DogfoodDocsSurfaceBlockConfig {
  readonly docsTree?: readonly string[];
  readonly selectedRoute?: string;
  readonly selectedRouteLabel?: string;
  readonly selectedHeadingId?: string;
  readonly searchState?: DogfoodDocsSurfaceSearchState;
  readonly proofArtifacts?: readonly DogfoodDocsSurfaceProofArtifact[];
}

export interface DogfoodDocsSurfaceSchemaData {
  readonly docsTree: readonly string[];
  readonly selectedRoute: string;
  readonly selectedRouteLabel?: string;
  readonly selectedHeadingId: string;
  readonly searchState: DogfoodDocsSurfaceSearchState;
  readonly proofArtifacts: readonly DogfoodDocsSurfaceProofArtifact[];
}

export interface SettingsMenuBlockRow {
  readonly id: string;
  readonly label: string;
  readonly valueLabel?: string;
  readonly description?: string;
}

export interface SettingsMenuBlockSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly SettingsMenuBlockRow[];
}

export interface SettingsMenuBlockConfig {
  readonly sectionCount?: number;
  readonly activeSettingLabel?: string;
  readonly sections?: readonly SettingsMenuBlockSection[];
}

export interface SearchPanelBlockConfig {
  readonly title?: string;
  readonly query?: string;
  readonly resultCount?: number;
  readonly activeResultLabel?: string;
}

export interface NotificationCenterBlockConfig {
  readonly notificationCount?: number;
  readonly activeFilterLabel?: string;
}

export interface PerfHudBlockConfig {
  readonly fps?: number;
  readonly frameMs?: number;
  readonly columns?: number;
  readonly rows?: number;
}

export interface HelpOverlayBlockConfig {
  readonly bindingCount?: number;
  readonly scopeLabel?: string;
}

export interface CommandPaletteBlockConfig {
  readonly commandCount?: number;
  readonly activeCommandLabel?: string;
}

export interface GuideInspectorBlockSection {
  readonly title: string;
  readonly content: string;
  readonly tone?: 'default' | 'muted';
}

export interface BlockPreviewBlockConfig {
  readonly blockName?: string;
  readonly modeCount?: number;
}

export interface GuideInspectorBlockConfig {
  readonly selectionLabel?: string;
  readonly factCount?: number;
  readonly sections?: readonly GuideInspectorBlockSection[];
}

export interface FooterHintBlockConfig {
  readonly controls?: string;
  readonly activeHint?: string;
  readonly status?: string;
}

export const docsSurfaceTreeRequirement = defineDataRequirement({
  id: 'docs-surface.docsTree',
  resource: 'dogfood.docs.tree',
  label: 'Docs tree',
  description: 'DOGFOOD documentation navigation tree available to the docs surface.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceRouteRequirement = defineDataRequirement({
  id: 'docs-surface.selectedRoute',
  resource: 'dogfood.docs.route',
  label: 'Selected route',
  description: 'Selected DOGFOOD docs route and heading identity.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceSearchRequirement = defineDataRequirement({
  id: 'docs-surface.searchState',
  resource: 'dogfood.docs.search',
  label: 'Search state',
  description: 'DOGFOOD documentation search query and hit count.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceProofRequirement = defineDataRequirement({
  id: 'docs-surface.proofArtifacts',
  resource: 'dogfood.docs.proofs',
  label: 'Proof artifacts',
  description: 'Capture or proof artifact inventory linked to the selected docs surface.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const dogfoodDocsSurfaceData = defineViewData({
  id: 'dogfood-docs-surface.data',
  label: 'DogfoodDocsSurfaceBlock data',
  description: 'DOGFOOD docs tree, active route, search posture, and proof artifacts.',
  requirements: [
    { name: 'docsTree', requirement: docsSurfaceTreeRequirement },
    { name: 'selectedRoute', requirement: docsSurfaceRouteRequirement },
    { name: 'searchState', requirement: docsSurfaceSearchRequirement },
    { name: 'proofArtifacts', requirement: docsSurfaceProofRequirement },
  ],
});

export const docsNavigateIntent = commandIntent<{ readonly route: string }>(
  'docs.navigate',
  {
    label: 'Navigate docs',
    description: 'Request navigation to a DOGFOOD documentation route.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsSearchIntent = commandIntent<{ readonly query: string }>(
  'docs.search',
  {
    label: 'Search docs',
    description: 'Request DOGFOOD documentation search for a query.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsOpenProofIntent = commandIntent<{ readonly proofArtifactId: string }>(
  'docs.openProof',
  {
    label: 'Open proof',
    description: 'Request opening a linked DOGFOOD proof artifact.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsCopyLinkIntent = commandIntent<{ readonly route: string }>(
  'docs.copyLink',
  {
    label: 'Copy docs link',
    description: 'Request copying a canonical DOGFOOD documentation link.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const dogfoodDocsSurfaceBlock: BlockDefinition<DogfoodDocsSurfaceBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'DogfoodDocsSurfaceBlock',
    family: 'docs-surface',
    scale: 'workspace',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the canonical DOGFOOD docs workspace across navigation, reader, search, and proof artifacts.',
      useWhen: ['DOGFOOD needs one inspectable Block contract for the documentation app surface.'],
      avoidWhen: ['A page only needs one local article, nav list, or search overlay.'],
      relatedDocs: ['docs/DOGFOOD.md', 'docs/design/DF-030-dogfood-docs-surface-block.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'navigation', required: true, description: 'Docs tree and selected route.' },
      { id: 'reader', required: true, description: 'Selected documentation reader content.' },
      { id: 'search', required: false, description: 'Current search query and hit count.' },
      { id: 'proofPanel', required: false, description: 'Linked proof artifact inventory.' },
    ],
    variants: [
      {
        id: 'canonical',
        label: 'Canonical docs',
        requiredSlots: ['navigation', 'reader'],
        optionalSlots: ['search', 'proofPanel'],
        facts: [{ kind: 'state', key: 'dogfood.docsSurface.layout', value: 'canonical' }],
      },
    ],
    composedComponents: [
      'NavigationListBlock',
      'DocumentationArticleBlock',
      'SearchPanelBlock',
      'GuideInspectorBlock',
      'createDocsApp()',
    ],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
    storyIds: ['dogfood-docs-surface.canonical'],
    examples: [{ id: 'dogfood.docs.surface', label: 'DOGFOOD docs surface' }],
    tags: ['dogfood', 'docs', 'surface', 'canonical'],
  },
  data: dogfoodDocsSurfaceData,
  commands: [
    docsNavigateIntent,
    docsSearchIntent,
    docsOpenProofIntent,
    docsCopyLinkIntent,
  ],
  render: renderDogfoodDocsSurfaceBlock,
});

export const dogfoodDocsSurfaceSchemaAdapter: BlockSchemaAdapter<DogfoodDocsSurfaceSchemaData> =
  defineBlockSchemaAdapter({
    id: 'dogfood-docs-surface.schema',
    parse(input) {
      const data = parseDogfoodDocsSurfaceSchemaData(input);
      if (data === undefined) {
        return schemaError(
          'dogfood.docsSurface.invalid',
          'DOGFOOD docs surface data is required.',
        );
      }

      return {
        ok: true,
        data,
      };
    },
    describe: () => ({
      requiredFields: ['docsTree', 'selectedRoute', 'selectedHeadingId', 'searchState', 'proofArtifacts'],
      optionalFields: ['selectedRouteLabel'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'DogfoodDocsSurfaceBlock' }],
    }),
  });

export const dogfoodDocsSurfaceSchemaBlock:
  SchemaBoundBlockDefinition<DogfoodDocsSurfaceSchemaData, DogfoodDocsSurfaceBlockConfig, string> =
  defineSchemaBlock<DogfoodDocsSurfaceSchemaData, DogfoodDocsSurfaceBlockConfig, string>({
    block: dogfoodDocsSurfaceBlock,
    schema: dogfoodDocsSurfaceSchemaAdapter,
    bind: (data) => ({
      input: {
        config: {
          docsTree: data.docsTree,
          selectedRoute: data.selectedRoute,
          ...(data.selectedRouteLabel === undefined ? {} : { selectedRouteLabel: data.selectedRouteLabel }),
          selectedHeadingId: data.selectedHeadingId,
          searchState: data.searchState,
          proofArtifacts: data.proofArtifacts,
        },
      },
      facts: dogfoodDocsSurfaceFacts(data),
    }),
  });

export function dogfoodDocsSurfacePreviewOutput(): string {
  return String(dogfoodDocsSurfaceBlock.render({
    mode: 'static',
    config: {
      docsTree: ['Guides', 'Blocks', 'Packages'],
      selectedRoute: 'blocks',
      selectedHeadingId: 'blocks',
      selectedRouteLabel: 'Blocks',
      searchState: { query: 'table', hitCount: 2 },
      proofArtifacts: [{ id: 'table-demo.gif', label: 'table-demo.gif', available: true }],
    },
  }).output);
}

export const blockPreviewDefinitionRequirement = defineDataRequirement({
  id: 'block-preview.definition',
  resource: 'dogfood.blocks.preview.definition',
  label: 'Preview block definition',
  description: 'Block definition selected for the DOGFOOD Blocks preview.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
});

export const blockPreviewModesRequirement = defineDataRequirement({
  id: 'block-preview.modes',
  resource: 'dogfood.blocks.preview.modes',
  label: 'Preview modes',
  description: 'Lowering modes rendered for the selected block preview.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
});

export const blockPreviewData = defineViewData({
  id: 'block-preview.data',
  label: 'BlockPreviewBlock data',
  description: 'Selected block definition plus lowering modes.',
  requirements: [
    { name: 'definition', requirement: blockPreviewDefinitionRequirement },
    { name: 'modes', requirement: blockPreviewModesRequirement },
  ],
});

export const blockPreviewSelectBlockIntent = commandIntent<{ readonly blockName: string }>(
  'blockPreview.selectBlock',
  {
    label: 'Select block',
    description: 'Request preview focus for a DOGFOOD or standard block.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockPreviewBlock' }],
  },
);

export const blockPreviewCycleModeIntent = commandIntent<{ readonly direction: -1 | 1 }>(
  'blockPreview.cycleMode',
  {
    label: 'Cycle mode',
    description: 'Request the next or previous lowering mode preview.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'BlockPreviewBlock' }],
  },
);

export const blockPreviewBlock: BlockDefinition<BlockPreviewBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'BlockPreviewBlock',
    family: 'dogfood-blocks',
    scale: 'section',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD live block preview and lowering summary surface.',
      useWhen: ['DOGFOOD needs to show a selected Block across supported output modes.'],
      avoidWhen: ['A page only needs static catalog metadata without live preview output.'],
      relatedDocs: ['docs/design-system/blocks.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'definition', required: true, description: 'Selected block definition and stories.' },
      { id: 'lowering', required: false, description: 'Mode-lowering preview output.' },
    ],
    variants: [
      {
        id: 'live',
        label: 'Live',
        requiredSlots: ['definition'],
        optionalSlots: ['lowering'],
        facts: [{ kind: 'state', key: 'dogfood.blockPreview.mode', value: 'live' }],
      },
    ],
    composedComponents: ['renderBlockTree()', 'boxSurface()', 'viewportSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
    storyIds: ['block-preview.live'],
    examples: [{ id: 'dogfood.blocks.preview', label: 'DOGFOOD block preview' }],
    tags: ['dogfood', 'blocks', 'preview'],
  },
  data: blockPreviewData,
  commands: [
    blockPreviewSelectBlockIntent,
    blockPreviewCycleModeIntent,
  ],
  render: renderBlockPreviewBlock,
});

export const guideInspectorSelectionRequirement = defineDataRequirement({
  id: 'guide-inspector.selection',
  resource: 'dogfood.guide.inspector.selection',
  label: 'Guide selection',
  description: 'Current section or block selection shown in the DOGFOOD guide inspector.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
});

export const guideInspectorFactsRequirement = defineDataRequirement({
  id: 'guide-inspector.facts',
  resource: 'dogfood.guide.inspector.facts',
  label: 'Guide facts',
  description: 'Facts, posture, and source links for the selected DOGFOOD guide row.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
});

export const guideInspectorData = defineViewData({
  id: 'guide-inspector.data',
  label: 'GuideInspectorBlock data',
  description: 'DOGFOOD guide selection details and facts.',
  requirements: [
    { name: 'selection', requirement: guideInspectorSelectionRequirement },
    { name: 'facts', requirement: guideInspectorFactsRequirement },
  ],
});

export const guideInspectorOpenSourceIntent = commandIntent<{ readonly sourcePath: string }>(
  'guideInspector.openSource',
  {
    label: 'Open source',
    description: 'Request opening the source path for the selected guide row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'GuideInspectorBlock' }],
  },
);

export const guideInspectorFocusSectionIntent = commandIntent<{ readonly sectionId: string }>(
  'guideInspector.focusSection',
  {
    label: 'Focus section',
    description: 'Request focus for another section related to the current inspector row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'GuideInspectorBlock' }],
  },
);

export const guideInspectorBlock: BlockDefinition<GuideInspectorBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'GuideInspectorBlock',
    family: 'dogfood-inspector',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD side inspector for selected guide rows and block facts.',
      useWhen: ['DOGFOOD needs a semantic side panel explaining the current docs selection.'],
      avoidWhen: ['A surface needs to render primary documentation content.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'selection', required: true, description: 'Current selected guide row.' },
      { id: 'facts', required: false, description: 'Selection facts, posture, and source hints.' },
    ],
    variants: [
      {
        id: 'guide-info',
        label: 'Guide info',
        requiredSlots: ['selection'],
        optionalSlots: ['facts'],
        facts: [{ kind: 'state', key: 'dogfood.inspector.surface', value: 'guide-info' }],
      },
    ],
    composedComponents: ['inspector()', 'boxSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    storyIds: ['guide-inspector.guide-info'],
    examples: [{ id: 'dogfood.guide.inspector', label: 'DOGFOOD guide inspector' }],
    tags: ['dogfood', 'inspector', 'facts'],
  },
  data: guideInspectorData,
  commands: [
    guideInspectorOpenSourceIntent,
    guideInspectorFocusSectionIntent,
  ],
  render: renderGuideInspectorBlock,
});

export const settingsSectionsRequirement = defineDataRequirement({
  id: 'settings.sections',
  resource: 'dogfood.settings.sections',
  label: 'Settings sections',
  description: 'Frame-owned DOGFOOD settings sections visible to the settings menu.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
});

export const settingsSelectionRequirement = defineDataRequirement({
  id: 'settings.selection',
  resource: 'dogfood.settings.selection',
  label: 'Settings selection',
  description: 'Current settings row focus inside the frame-owned settings menu.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
});

export const settingsMenuData = defineViewData({
  id: 'settings-menu.data',
  label: 'SettingsMenuBlock data',
  description: 'DOGFOOD frame settings sections and active row.',
  requirements: [
    { name: 'sections', requirement: settingsSectionsRequirement },
    { name: 'selection', requirement: settingsSelectionRequirement },
  ],
});

export const settingsActivateRowIntent = commandIntent<{ readonly rowId: string }>(
  'settings.activateRow',
  {
    label: 'Activate row',
    description: 'Request activation of the focused settings row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsSetLocaleIntent = commandIntent<{ readonly localeId: string }>(
  'settings.setLocale',
  {
    label: 'Set locale',
    description: 'Request the DOGFOOD locale selection to change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsSetShellThemeIntent = commandIntent<{ readonly themeId: string }>(
  'settings.setShellTheme',
  {
    label: 'Set shell theme',
    description: 'Request a frame shell theme change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsMenuBlock: BlockDefinition<SettingsMenuBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'SettingsMenuBlock',
    family: 'dogfood-settings',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the semantic settings menu contract for locale, theme, and app preferences.',
      useWhen: ['DOGFOOD needs an inspectable settings surface with command intents.'],
      avoidWhen: ['A frame shell only needs the lower-level settings drawer renderer.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'sections', required: true, description: 'Settings groups and rows.' },
      { id: 'selection', required: false, description: 'Focused or active setting row.' },
    ],
    variants: [
      {
        id: 'drawer',
        label: 'Drawer',
        requiredSlots: ['sections'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.settings.surface', value: 'drawer' }],
      },
    ],
    composedComponents: ['createFramedApp() settings', 'preferenceListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    storyIds: ['settings-menu.drawer'],
    examples: [{ id: 'dogfood.settings', label: 'DOGFOOD settings menu' }],
    tags: ['dogfood', 'settings', 'locale', 'theme'],
  },
  data: settingsMenuData,
  commands: [
    settingsActivateRowIntent,
    settingsSetLocaleIntent,
    settingsSetShellThemeIntent,
  ],
  render: renderSettingsMenuBlock,
});

export const searchQueryRequirement = defineDataRequirement({
  id: 'search.query',
  resource: 'dogfood.search.query',
  label: 'Search query',
  description: 'Current DOGFOOD search query.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchItemsRequirement = defineDataRequirement({
  id: 'search.items',
  resource: 'dogfood.search.items',
  label: 'Search results',
  description: 'Visible DOGFOOD search result rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchSelectionRequirement = defineDataRequirement({
  id: 'search.selection',
  resource: 'dogfood.search.selection',
  label: 'Search selection',
  description: 'Focused DOGFOOD search result.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
});

export const searchPanelData = defineViewData({
  id: 'search-panel.data',
  label: 'SearchPanelBlock data',
  description: 'DOGFOOD search query, results, and focused row.',
  requirements: [
    { name: 'query', requirement: searchQueryRequirement },
    { name: 'items', requirement: searchItemsRequirement },
    { name: 'selection', requirement: searchSelectionRequirement },
  ],
});

export const searchSubmitQueryIntent = commandIntent<{ readonly query: string }>(
  'search.submitQuery',
  {
    label: 'Submit query',
    description: 'Request DOGFOOD search results for the active query.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
  },
);

export const searchSelectResultIntent = commandIntent<{ readonly resultId: string }>(
  'search.selectResult',
  {
    label: 'Select result',
    description: 'Request activation of a DOGFOOD search result.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
  },
);

export const searchDismissIntent = commandIntent('search.dismiss', {
  label: 'Dismiss search',
  description: 'Request closing the DOGFOOD search surface.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SearchPanelBlock' }],
});

export const searchPanelBlock: BlockDefinition<SearchPanelBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'SearchPanelBlock',
    family: 'dogfood-search',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD search query and result-selection command contract.',
      useWhen: ['DOGFOOD needs a searchable command or page picker surface.'],
      avoidWhen: ['A surface only needs local filtering without global search semantics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'query', required: true, description: 'Current search query.' },
      { id: 'items', required: true, description: 'Visible search results.' },
      { id: 'selection', required: false, description: 'Focused search result.' },
    ],
    variants: [
      {
        id: 'overlay',
        label: 'Overlay',
        requiredSlots: ['query', 'items'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.search.surface', value: 'overlay' }],
      },
    ],
    composedComponents: ['createFramedApp() search', 'browsableListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'SearchPanelBlock' }],
    storyIds: ['search-panel.overlay'],
    examples: [{ id: 'dogfood.search', label: 'DOGFOOD search panel' }],
    tags: ['dogfood', 'search', 'frame'],
  },
  data: searchPanelData,
  commands: [
    searchSubmitQueryIntent,
    searchSelectResultIntent,
    searchDismissIntent,
  ],
  render: renderSearchPanelBlock,
});

export const notificationItemsRequirement = defineDataRequirement({
  id: 'notifications.items',
  resource: 'dogfood.notifications.items',
  label: 'Notification items',
  description: 'Frame-owned DOGFOOD notification rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
});

export const notificationFilterRequirement = defineDataRequirement({
  id: 'notifications.filter',
  resource: 'dogfood.notifications.filter',
  label: 'Notification filter',
  description: 'Current notification center filter state.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
});

export const notificationCenterData = defineViewData({
  id: 'notification-center.data',
  label: 'NotificationCenterBlock data',
  description: 'DOGFOOD notification items and filter posture.',
  requirements: [
    { name: 'items', requirement: notificationItemsRequirement },
    { name: 'filter', requirement: notificationFilterRequirement },
  ],
});

export const notificationDismissIntent = commandIntent<{ readonly notificationId: string }>(
  'notifications.dismiss',
  {
    label: 'Dismiss notification',
    description: 'Request dismissal of a DOGFOOD notification row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NotificationCenterBlock' }],
  },
);

export const notificationSetFilterIntent = commandIntent<{ readonly filterId: string }>(
  'notifications.setFilter',
  {
    label: 'Set notification filter',
    description: 'Request a notification center filter change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NotificationCenterBlock' }],
  },
);

export const notificationCenterBlock: BlockDefinition<NotificationCenterBlockConfig, string> =
  defineBlock({
    metadata: {
      packageName: DOGFOOD_BLOCK_PACKAGE,
      blockName: 'NotificationCenterBlock',
      family: 'dogfood-notifications',
      scale: 'panel',
      modes: DOGFOOD_BLOCK_MODES,
      docs: {
        summary: 'Owns the frame notification center contract for inspectable DOGFOOD notices.',
        useWhen: ['DOGFOOD needs to expose notification center state and intents.'],
        avoidWhen: ['A page only emits a transient local message without frame ownership.'],
        relatedDocs: ['docs/DOGFOOD.md'],
      },
      sourcePath: 'packages/bijou-tui/src/app-frame.ts',
      slots: [
        { id: 'items', required: true, description: 'Notification rows.' },
        { id: 'filter', required: false, description: 'Current notification filter.' },
      ],
      variants: [
        {
          id: 'center',
          label: 'Center',
          requiredSlots: ['items'],
          optionalSlots: ['filter'],
          facts: [{ kind: 'state', key: 'dogfood.notifications.surface', value: 'center' }],
        },
      ],
      composedComponents: ['notificationCenterSurface()', 'toast()'],
      semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
      storyIds: ['notification-center.center'],
      examples: [{ id: 'dogfood.notifications', label: 'DOGFOOD notification center' }],
      tags: ['dogfood', 'notifications', 'frame'],
    },
    data: notificationCenterData,
    commands: [
      notificationDismissIntent,
      notificationSetFilterIntent,
    ],
    render: renderNotificationCenterBlock,
  });

export const perfHudMetricsRequirement = defineDataRequirement({
  id: 'perf-hud.metrics',
  resource: 'dogfood.perfHud.metrics',
  label: 'Performance metrics',
  description: 'Frame timing metrics visible in the DOGFOOD perf HUD.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
});

export const perfHudViewportRequirement = defineDataRequirement({
  id: 'perf-hud.viewport',
  resource: 'dogfood.perfHud.viewport',
  label: 'Viewport size',
  description: 'Current DOGFOOD terminal viewport size shown in diagnostics.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
});

export const perfHudData = defineViewData({
  id: 'perf-hud.data',
  label: 'PerfHudBlock data',
  description: 'DOGFOOD frame timing and viewport diagnostics.',
  requirements: [
    { name: 'metrics', requirement: perfHudMetricsRequirement },
    { name: 'viewport', requirement: perfHudViewportRequirement },
  ],
});

export const perfHudToggleIntent = commandIntent('perfHud.toggle', {
  label: 'Toggle perf HUD',
  description: 'Request the DOGFOOD perf HUD to open or close.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'PerfHudBlock' }],
});

export const perfHudBlock: BlockDefinition<PerfHudBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'PerfHudBlock',
    family: 'dogfood-diagnostics',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD performance HUD diagnostics contract.',
      useWhen: ['DOGFOOD needs inspectable timing and viewport diagnostics.'],
      avoidWhen: ['A page needs product content rather than frame diagnostics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'metrics', required: true, description: 'Timing metrics.' },
      { id: 'viewport', required: true, description: 'Viewport dimensions.' },
    ],
    variants: [
      {
        id: 'hud',
        label: 'HUD',
        requiredSlots: ['metrics', 'viewport'],
        facts: [{ kind: 'state', key: 'dogfood.perfHud.surface', value: 'hud' }],
      },
    ],
    composedComponents: ['renderFramePerfHudOverlay()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
    storyIds: ['perf-hud.hud'],
    examples: [{ id: 'dogfood.perfHud', label: 'DOGFOOD perf HUD' }],
    tags: ['dogfood', 'diagnostics', 'frame'],
  },
  data: perfHudData,
  commands: [perfHudToggleIntent],
  render: renderPerfHudBlock,
});

export const helpBindingsRequirement = defineDataRequirement({
  id: 'help.bindings',
  resource: 'dogfood.help.bindings',
  label: 'Help bindings',
  description: 'Keyboard bindings visible in the DOGFOOD help overlay.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
});

export const helpScopeRequirement = defineDataRequirement({
  id: 'help.scope',
  resource: 'dogfood.help.scope',
  label: 'Help scope',
  description: 'Active page or layer scope for DOGFOOD keyboard guidance.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
});

export const helpOverlayData = defineViewData({
  id: 'help-overlay.data',
  label: 'HelpOverlayBlock data',
  description: 'DOGFOOD keyboard help bindings and active scope.',
  requirements: [
    { name: 'bindings', requirement: helpBindingsRequirement },
    { name: 'scope', requirement: helpScopeRequirement },
  ],
});

export const helpDismissIntent = commandIntent('help.dismiss', {
  label: 'Dismiss help',
  description: 'Request closing the DOGFOOD keyboard help overlay.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'HelpOverlayBlock' }],
});

export const helpOverlayBlock: BlockDefinition<HelpOverlayBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'HelpOverlayBlock',
    family: 'dogfood-help',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD keyboard help overlay contract.',
      useWhen: ['DOGFOOD needs page- or layer-scoped keyboard guidance.'],
      avoidWhen: ['A surface only needs a single footer hint line.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'bindings', required: true, description: 'Visible keyboard bindings.' },
      { id: 'scope', required: true, description: 'Active help scope.' },
    ],
    variants: [
      {
        id: 'overlay',
        label: 'Overlay',
        requiredSlots: ['bindings', 'scope'],
        facts: [{ kind: 'state', key: 'dogfood.help.surface', value: 'overlay' }],
      },
    ],
    composedComponents: ['renderHelpOverlay()', 'modal()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
    storyIds: ['help-overlay.overlay'],
    examples: [{ id: 'dogfood.help', label: 'DOGFOOD keyboard help' }],
    tags: ['dogfood', 'help', 'frame'],
  },
  data: helpOverlayData,
  commands: [helpDismissIntent],
  render: renderHelpOverlayBlock,
});

export const commandPaletteCommandsRequirement = defineDataRequirement({
  id: 'command-palette.commands',
  resource: 'dogfood.commandPalette.commands',
  label: 'Command palette commands',
  description: 'Frame-owned DOGFOOD command palette items.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'CommandPaletteBlock' }],
});

export const commandPaletteSelectionRequirement = defineDataRequirement({
  id: 'command-palette.selection',
  resource: 'dogfood.commandPalette.selection',
  label: 'Command palette selection',
  description: 'Focused DOGFOOD command palette item.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'CommandPaletteBlock' }],
});

export const commandPaletteData = defineViewData({
  id: 'command-palette.data',
  label: 'CommandPaletteBlock data',
  description: 'DOGFOOD command palette items and active command selection.',
  requirements: [
    { name: 'commands', requirement: commandPaletteCommandsRequirement },
    { name: 'selection', requirement: commandPaletteSelectionRequirement },
  ],
});

export const commandPaletteExecuteIntent = commandIntent<{ readonly commandId: string }>(
  'commandPalette.execute',
  {
    label: 'Execute command',
    description: 'Request execution of the selected DOGFOOD command palette item.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'CommandPaletteBlock' }],
  },
);

export const commandPaletteDismissIntent = commandIntent('commandPalette.dismiss', {
  label: 'Dismiss command palette',
  description: 'Request closing the DOGFOOD command palette.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'CommandPaletteBlock' }],
});

export const commandPaletteBlock: BlockDefinition<CommandPaletteBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'CommandPaletteBlock',
    family: 'dogfood-commands',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD command palette contract for global command discovery.',
      useWhen: ['DOGFOOD needs inspectable global commands and command execution intents.'],
      avoidWhen: ['A page only needs a local inline action row.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'commands', required: true, description: 'Available command rows.' },
      { id: 'selection', required: false, description: 'Focused command row.' },
    ],
    variants: [
      {
        id: 'palette',
        label: 'Palette',
        requiredSlots: ['commands'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.commandPalette.surface', value: 'palette' }],
      },
    ],
    composedComponents: ['commandPaletteSurface()', 'modal()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'CommandPaletteBlock' }],
    storyIds: ['command-palette.palette'],
    examples: [{ id: 'dogfood.commandPalette', label: 'DOGFOOD command palette' }],
    tags: ['dogfood', 'commands', 'frame'],
  },
  data: commandPaletteData,
  commands: [
    commandPaletteExecuteIntent,
    commandPaletteDismissIntent,
  ],
  render: renderCommandPaletteBlock,
});

export const footerControlsRequirement = defineDataRequirement({
  id: 'footer.controls',
  resource: 'dogfood.frame.footer.controls',
  label: 'Footer controls',
  description: 'Shell-owned controls visible in the DOGFOOD footer hint line.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
});

export const footerStatusRequirement = defineDataRequirement({
  id: 'footer.status',
  resource: 'dogfood.frame.footer.status',
  label: 'Footer status',
  description: 'Optional active pane or page status appended to the footer.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
});

export const footerHintData = defineViewData({
  id: 'footer-hint.data',
  label: 'FooterHintBlock data',
  description: 'DOGFOOD frame footer controls and active status hints.',
  requirements: [
    { name: 'controls', requirement: footerControlsRequirement },
    { name: 'status', requirement: footerStatusRequirement },
  ],
});

export const footerHintBlock: BlockDefinition<FooterHintBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'FooterHintBlock',
    family: 'dogfood-shell',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the shell footer hint contract for visible DOGFOOD controls and active status.',
      useWhen: ['DOGFOOD needs to show shell-level key hints or active-pane controls.'],
      avoidWhen: ['A surface needs a full help overlay or command palette.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'controls', required: true, description: 'Always-visible shell controls.' },
      { id: 'status', required: false, description: 'Active-pane or page status text.' },
    ],
    variants: [
      {
        id: 'line',
        label: 'Line',
        requiredSlots: ['controls'],
        optionalSlots: ['status'],
        facts: [{ kind: 'state', key: 'dogfood.footer.surface', value: 'line' }],
      },
    ],
    composedComponents: ['createFramedApp() footer', 'localized footer hints'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
    storyIds: ['footer-hint.line'],
    examples: [{ id: 'dogfood.footer', label: 'DOGFOOD footer hints' }],
    tags: ['dogfood', 'footer', 'shell'],
  },
  data: footerHintData,
  render: renderFooterHintBlock,
});

export const documentationArticleRequirement = defineDataRequirement({
  id: 'documentation.article',
  resource: 'dogfood.documentation.article',
  label: 'Documentation article',
  description: 'Current DOGFOOD documentation article body.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
});

export const documentationHeadingsRequirement = defineDataRequirement({
  id: 'documentation.headings',
  resource: 'dogfood.documentation.headings',
  label: 'Article headings',
  description: 'Headings discovered from the active DOGFOOD documentation article.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
});

export const documentationArticleData = defineViewData({
  id: 'documentation-article.data',
  label: 'DocumentationArticleBlock data',
  description: 'DOGFOOD article content and heading outline.',
  requirements: [
    { name: 'article', requirement: documentationArticleRequirement },
    { name: 'headings', requirement: documentationHeadingsRequirement },
  ],
});

export const documentationSelectHeadingIntent = commandIntent<{ readonly headingId: string }>(
  'documentation.selectHeading',
  {
    label: 'Select heading',
    description: 'Request navigation to a heading in the active article.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DocumentationArticleBlock' }],
  },
);

export const documentationOpenReferenceIntent = commandIntent<{ readonly referenceId: string }>(
  'documentation.openReference',
  {
    label: 'Open reference',
    description: 'Request opening a referenced doc, package, or source path.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DocumentationArticleBlock' }],
  },
);

export const documentationArticleBlock: BlockDefinition<DocumentationArticleBlockConfig, string> =
  defineBlock({
    metadata: {
      packageName: DOGFOOD_BLOCK_PACKAGE,
      blockName: 'DocumentationArticleBlock',
      family: 'dogfood-documentation',
      scale: 'section',
      modes: DOGFOOD_BLOCK_MODES,
      docs: {
        summary: 'Owns a DOGFOOD documentation article and its local heading/reference intents.',
        useWhen: ['DOGFOOD needs to render a documentation article as a semantic content block.'],
        avoidWhen: ['A surface is only selecting which article should be active.'],
        relatedDocs: ['docs/README.md', 'docs/DOGFOOD.md'],
      },
      sourcePath: 'examples/docs/app.ts',
      slots: [
        { id: 'article', required: true, description: 'Markdown or rendered documentation body.' },
        { id: 'outline', required: false, description: 'Article heading outline.' },
      ],
      variants: [
        {
          id: 'article',
          label: 'Article',
          requiredSlots: ['article'],
          optionalSlots: ['outline'],
          facts: [{ kind: 'state', key: 'dogfood.documentation.layout', value: 'article' }],
        },
      ],
      composedComponents: ['markdown()', 'viewportSurface()', 'link()'],
      semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
      storyIds: ['documentation-article.article'],
      examples: [{ id: 'dogfood.documentation.article', label: 'DOGFOOD article content' }],
      tags: ['dogfood', 'docs', 'article'],
    },
    data: documentationArticleData,
    commands: [
      documentationSelectHeadingIntent,
      documentationOpenReferenceIntent,
    ],
    render: renderDocumentationArticleBlock,
  });

export const navigationItemsRequirement = defineDataRequirement({
  id: 'navigation.items',
  resource: 'dogfood.navigation.items',
  label: 'Navigation items',
  description: 'Visible DOGFOOD navigation groups and rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
});

export const navigationSelectionRequirement = defineDataRequirement({
  id: 'navigation.selection',
  resource: 'dogfood.navigation.selection',
  label: 'Navigation selection',
  description: 'Focused or active DOGFOOD navigation row.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
});

export const navigationListData = defineViewData({
  id: 'navigation-list.data',
  label: 'NavigationListBlock data',
  description: 'DOGFOOD navigation rows and selected item.',
  requirements: [
    { name: 'items', requirement: navigationItemsRequirement },
    { name: 'selection', requirement: navigationSelectionRequirement },
  ],
});

export const navigationSelectItemIntent = commandIntent<{ readonly itemId: string }>(
  'navigation.selectItem',
  {
    label: 'Select item',
    description: 'Request activation of a DOGFOOD navigation row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationExpandGroupIntent = commandIntent<{ readonly groupId: string }>(
  'navigation.expandGroup',
  {
    label: 'Expand group',
    description: 'Request expansion of a DOGFOOD navigation group.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationCollapseGroupIntent = commandIntent<{ readonly groupId: string }>(
  'navigation.collapseGroup',
  {
    label: 'Collapse group',
    description: 'Request collapse of a DOGFOOD navigation group.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NavigationListBlock' }],
  },
);

export const navigationListBlock: BlockDefinition<NavigationListBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'NavigationListBlock',
    family: 'dogfood-navigation',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns DOGFOOD section and guide navigation as selectable semantic rows.',
      useWhen: ['DOGFOOD needs selectable navigation with explicit command intents.'],
      avoidWhen: ['A component only needs a local menu without app navigation semantics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'items', required: true, description: 'Navigation rows and groups.' },
      { id: 'selection', required: false, description: 'Current focused or active row.' },
    ],
    variants: [
      {
        id: 'docs-sidebar',
        label: 'Docs sidebar',
        requiredSlots: ['items'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.navigation.scope', value: 'docs-sidebar' }],
      },
    ],
    composedComponents: ['browsableListSurface()', 'viewportSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
    storyIds: ['navigation-list.docs-sidebar'],
    examples: [{ id: 'dogfood.navigation', label: 'DOGFOOD docs navigation' }],
    tags: ['dogfood', 'navigation', 'selection'],
  },
  data: navigationListData,
  commands: [
    navigationSelectItemIntent,
    navigationExpandGroupIntent,
    navigationCollapseGroupIntent,
  ],
  render: renderNavigationListBlock,
});

export const titleRouteRequirement = defineDataRequirement({
  id: 'title.route',
  resource: 'dogfood.route',
  label: 'Current route',
  description: 'Current DOGFOOD route used by the title screen call-to-action posture.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
});

export const titleScreenData = defineViewData({
  id: 'title-screen.data',
  label: 'TitleScreenBlock data',
  description: 'DOGFOOD title route context.',
  requirements: [
    { name: 'route', requirement: titleRouteRequirement },
  ],
});

export const titleOpenDocsIntent = commandIntent('title.openDocs', {
  label: 'Open docs',
  description: 'Request navigation from the title screen into the documentation app.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleOpenStorybookIntent = commandIntent('title.openStorybook', {
  label: 'Open Storybook',
  description: 'Request navigation from the title screen into the Storybook workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleOpenSettingsIntent = commandIntent('title.openSettings', {
  label: 'Open settings',
  description: 'Request the frame-owned DOGFOOD settings surface.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'TitleScreenBlock' }],
});

export const titleScreenBlock: BlockDefinition<TitleScreenBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'TitleScreenBlock',
    family: 'dogfood-entry',
    scale: 'app',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Introduces Bijou DOGFOOD and routes users toward docs, Storybook, or settings.',
      useWhen: ['DOGFOOD needs a first screen that exposes app-level entry intents.'],
      avoidWhen: ['A nested documentation article needs local section content.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'hero', required: true, description: 'Primary title and value proposition.' },
      { id: 'actions', required: false, description: 'Available entry actions.' },
    ],
    variants: [
      {
        id: 'default',
        label: 'Default',
        requiredSlots: ['hero'],
        optionalSlots: ['actions'],
        facts: [{ kind: 'state', key: 'dogfood.title.layout', value: 'default' }],
      },
    ],
    composedComponents: ['landing page', 'AppFrame settings'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
    storyIds: ['title-screen.default'],
    examples: [{ id: 'dogfood.title', label: 'DOGFOOD title screen' }],
    tags: ['dogfood', 'title', 'navigation'],
  },
  data: titleScreenData,
  commands: [
    titleOpenDocsIntent,
    titleOpenStorybookIntent,
    titleOpenSettingsIntent,
  ],
  render: renderTitleScreenBlock,
});

export const storybookStoriesRequirement = defineDataRequirement({
  id: 'storybook.stories',
  resource: 'dogfood.storybook.stories',
  label: 'Story catalog',
  description: 'Available component stories for the DOGFOOD Storybook workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'StorybookWorkbenchBlock' }],
});

export const storybookSelectionRequirement = defineDataRequirement({
  id: 'storybook.selection',
  resource: 'dogfood.storybook.selection',
  label: 'Selected story',
  description: 'The active story, variant, and profile in the Storybook workbench.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'StorybookWorkbenchBlock' }],
});

export const storybookWorkbenchData = defineViewData({
  id: 'storybook-workbench.data',
  label: 'StorybookWorkbenchBlock data',
  description: 'DOGFOOD Storybook catalog and selection data.',
  requirements: [
    { name: 'stories', requirement: storybookStoriesRequirement },
    { name: 'selection', requirement: storybookSelectionRequirement },
  ],
});

export const storybookSelectStoryIntent = commandIntent<{ readonly storyId: string }>(
  'storybook.selectStory',
  {
    label: 'Select story',
    description: 'Request focus for a component story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'StorybookWorkbenchBlock' }],
  },
);

export const storybookCycleVariantIntent = commandIntent<{ readonly direction: -1 | 1 }>(
  'storybook.cycleVariant',
  {
    label: 'Cycle variant',
    description: 'Request the next or previous variant for the selected story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'StorybookWorkbenchBlock' }],
  },
);

export const storybookSetProfileIntent = commandIntent<{ readonly profileIndex: number }>(
  'storybook.setProfile',
  {
    label: 'Set profile',
    description: 'Request a viewport/profile preset for the selected story.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'StorybookWorkbenchBlock' }],
  },
);

export const storybookWorkbenchBlock: BlockDefinition<StorybookWorkbenchBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'StorybookWorkbenchBlock',
    family: 'dogfood-workbench',
    scale: 'app',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Frames the component story catalog, live preview, testing notes, and footer controls.',
      useWhen: [
        'DOGFOOD needs to present component stories inside the same app frame posture as docs.',
      ],
      avoidWhen: [
        'A production app needs to embed a single component preview without the DOGFOOD story catalog.',
      ],
      relatedDocs: ['docs/design/DF-069-block-authored-dogfood.md'],
    },
    sourcePath: 'examples/docs/storybook-app.ts',
    slots: [
      { id: 'catalog', required: true, description: 'Story catalog navigation.' },
      { id: 'preview', required: true, description: 'Live component story preview.' },
      { id: 'testing', required: false, description: 'Mode-lowering and interaction notes.' },
      { id: 'footer', required: false, description: 'Workbench key hints and status text.' },
    ],
    variants: [
      {
        id: 'wide',
        label: 'Wide',
        requiredSlots: ['catalog', 'preview'],
        optionalSlots: ['testing', 'footer'],
        facts: [{ kind: 'state', key: 'dogfood.storybook.layout', value: 'wide' }],
      },
      {
        id: 'narrow',
        label: 'Narrow',
        requiredSlots: ['preview'],
        optionalSlots: ['catalog', 'testing', 'footer'],
        facts: [{ kind: 'state', key: 'dogfood.storybook.layout', value: 'narrow' }],
      },
    ],
    composedComponents: ['createFramedApp()', 'viewportSurface()', 'browsableListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'StorybookWorkbenchBlock' }],
    storyIds: ['storybook.workbench.wide', 'storybook.workbench.narrow'],
    examples: [{ id: 'storybook.dogfood', label: 'DOGFOOD Storybook workbench' }],
    tags: ['dogfood', 'storybook', 'workbench', 'app-frame'],
  },
  data: storybookWorkbenchData,
  commands: [
    storybookSelectStoryIntent,
    storybookCycleVariantIntent,
    storybookSetProfileIntent,
  ],
  render: renderStorybookWorkbenchBlock,
});

export const storybookWorkbenchBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: storybookWorkbenchBlock,
  role: 'workbench',
  surfaceId: 'storybook.workbench',
  description: 'Storybook component workstation entrypoint.',
  tags: ['storybook', 'workbench'],
});

export const titleScreenBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: titleScreenBlock,
  role: 'title',
  surfaceId: 'landing.title',
  description: 'DOGFOOD title and entry action surface.',
  tags: ['title', 'entry'],
});

export const navigationListBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: navigationListBlock,
  role: 'navigation',
  surfaceId: 'docs.navigation',
  description: 'DOGFOOD docs and guide navigation surface.',
  tags: ['navigation', 'docs'],
});

export const documentationArticleBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: documentationArticleBlock,
  role: 'article',
  surfaceId: 'docs.article',
  description: 'DOGFOOD documentation article content surface.',
  tags: ['docs', 'article'],
});

export const dogfoodDocsSurfaceBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: dogfoodDocsSurfaceBlock,
  role: 'app-shell',
  surfaceId: 'docs.surface',
  description: 'DOGFOOD docs, navigation, search, reader, and proof artifact surface.',
  tags: ['docs', 'surface', 'canonical'],
});

export const blockPreviewBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: blockPreviewBlock,
  role: 'preview',
  surfaceId: 'blocks.preview',
  description: 'DOGFOOD Blocks live preview and lowering surface.',
  tags: ['blocks', 'preview'],
});

export const guideInspectorBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: guideInspectorBlock,
  role: 'inspector',
  surfaceId: 'guide.inspector',
  description: 'DOGFOOD side inspector surface.',
  tags: ['inspector', 'guide'],
});

export const settingsMenuBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: settingsMenuBlock,
  role: 'settings',
  surfaceId: 'frame.settings',
  description: 'DOGFOOD frame settings menu surface.',
  tags: ['settings', 'frame'],
});

export const searchPanelBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: searchPanelBlock,
  role: 'search',
  surfaceId: 'frame.search',
  description: 'DOGFOOD frame search query and result surface.',
  tags: ['search', 'frame'],
});

export const notificationCenterBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: notificationCenterBlock,
  role: 'notifications',
  surfaceId: 'frame.notifications',
  description: 'DOGFOOD frame notification center surface.',
  tags: ['notifications', 'frame'],
});

export const perfHudBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: perfHudBlock,
  role: 'diagnostics',
  surfaceId: 'frame.perfHud',
  description: 'DOGFOOD frame performance HUD surface.',
  tags: ['diagnostics', 'frame'],
});

export const helpOverlayBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: helpOverlayBlock,
  role: 'help',
  surfaceId: 'frame.help',
  description: 'DOGFOOD frame keyboard help overlay surface.',
  tags: ['help', 'frame'],
});

export const commandPaletteBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: commandPaletteBlock,
  role: 'commands',
  surfaceId: 'frame.commandPalette',
  description: 'DOGFOOD frame command palette surface.',
  tags: ['commands', 'frame'],
});

export const footerHintBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: footerHintBlock,
  role: 'footer',
  surfaceId: 'frame.footer',
  description: 'DOGFOOD frame footer hint surface.',
  tags: ['footer', 'frame'],
});

export const requiredDogfoodBlockSurfaceIds: readonly string[] = Object.freeze([
  'landing.title',
  'docs.navigation',
  'docs.article',
  'docs.surface',
  'blocks.preview',
  'guide.inspector',
  'frame.settings',
  'frame.search',
  'frame.notifications',
  'frame.perfHud',
  'frame.help',
  'frame.commandPalette',
  'frame.footer',
  'storybook.workbench',
]);

export const defaultDogfoodBlockRegistry = dogfoodBlockRegistry([
  titleScreenBlockRegistryEntry,
  navigationListBlockRegistryEntry,
  documentationArticleBlockRegistryEntry,
  dogfoodDocsSurfaceBlockRegistryEntry,
  blockPreviewBlockRegistryEntry,
  guideInspectorBlockRegistryEntry,
  settingsMenuBlockRegistryEntry,
  searchPanelBlockRegistryEntry,
  notificationCenterBlockRegistryEntry,
  perfHudBlockRegistryEntry,
  helpOverlayBlockRegistryEntry,
  commandPaletteBlockRegistryEntry,
  footerHintBlockRegistryEntry,
  storybookWorkbenchBlockRegistryEntry,
]);

export interface DogfoodBlockCoverageReport {
  readonly requiredSurfaceIds: readonly string[];
  readonly registeredSurfaceIds: readonly string[];
  readonly missingSurfaceIds: readonly string[];
}

export function dogfoodBlockCoverageReport(
  registry: DogfoodBlockRegistry = defaultDogfoodBlockRegistry,
): DogfoodBlockCoverageReport {
  const registeredSurfaceIds = registry.surfaceIds();
  const registered = new Set(registeredSurfaceIds);

  return Object.freeze({
    requiredSurfaceIds: requiredDogfoodBlockSurfaceIds,
    registeredSurfaceIds,
    missingSurfaceIds: Object.freeze(
      requiredDogfoodBlockSurfaceIds.filter((surfaceId) => !registered.has(surfaceId)),
    ),
  });
}

export function dogfoodBlockRegistryEntry(
  input: DogfoodBlockRegistryEntryInput,
): DogfoodBlockRegistryEntry {
  const candidateBlock: unknown = input.block;
  if (!isBlockDefinition(candidateBlock)) {
    throw new Error('dogfood block registry entry: block was not created by defineBlock()');
  }

  const role = normalizeDogfoodBlockRole(input.role);
  const surfaceId = normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'surfaceId',
    value: input.surfaceId,
  });
  const description = optionalTrimmedText(input.description);
  const tags = Object.freeze((input.tags ?? []).map((tag) => normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'tag',
    value: tag,
  })));

  const entry = {
    block: input.block,
    blockName: input.block.metadata.blockName,
    packageName: input.block.metadata.packageName,
    role,
    surfaceId,
    ...(description === undefined ? {} : { description }),
    tags,
  } as unknown as DogfoodBlockRegistryEntry;

  Object.defineProperty(entry, DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND, { value: true });
  return Object.freeze(entry);
}

export function isDogfoodBlockRegistryEntry(
  value: unknown,
): value is DogfoodBlockRegistryEntry {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND)
      && (value as DogfoodBlockRegistryEntryBrandCarrier)[DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND] === true,
  );
}

export function dogfoodBlockRegistry(
  entries: readonly DogfoodBlockRegistryEntry[],
): DogfoodBlockRegistry {
  return new DogfoodBlockRegistry(entries);
}

export function isDogfoodBlockRegistry(value: unknown): value is DogfoodBlockRegistry {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, DOGFOOD_BLOCK_REGISTRY_BRAND)
      && (value as DogfoodBlockRegistryBrandCarrier)[DOGFOOD_BLOCK_REGISTRY_BRAND] === true,
  );
}

function renderDogfoodDocsSurfaceBlock(
  input: BlockRenderInput<DogfoodDocsSurfaceBlockConfig>,
): BlockRenderResult<string> {
  const config = normalizeDogfoodDocsSurfaceConfig(input.config);
  const routeLabel = config.selectedRouteLabel ?? config.selectedRoute;
  const proofLabel = dogfoodDocsSurfaceProofLabel(config.proofArtifacts);
  const facts = dogfoodDocsSurfaceFacts(config);

  if (input.mode === 'pipe') {
    return {
      output: [
        'route\theading\tsearch-hit-count\tproofs',
        `${config.selectedRoute}\t${config.selectedHeadingId}\t${config.searchState.hitCount}\t${proofLabel}`,
      ].join('\n'),
      facts,
    };
  }

  if (input.mode === 'accessible') {
    return {
      output: [
        `DOGFOOD docs surface. ${routeLabel} page selected.`,
        `Reader heading ${config.selectedHeadingId}.`,
        `Search query ${config.searchState.query || 'empty'} has ${config.searchState.hitCount} hits.`,
        `Proof artifacts: ${proofLabel}.`,
      ].join(' '),
      facts,
    };
  }

  return {
    output: [
      '+-- DOGFOOD Docs Surface ------------------------------------------+',
      '| navigation             | reader                                  |',
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceSelectedNavLabel(config), 22)} | ${dogfoodDocsSurfaceCell(`# ${routeLabel}`, 39)} |`,
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceNavLabel(config, 1), 22)} | ${dogfoodDocsSurfaceCell('Blocks are reusable contracts...', 39)} |`,
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceNavLabel(config, 2), 22)} | ${dogfoodDocsSurfaceCell('', 39)} |`,
      '|------------------------+-----------------------------------------|',
      `| ${dogfoodDocsSurfaceCell(`search: ${config.searchState.query || 'empty'} (${config.searchState.hitCount} hits)`, 22)} | ${dogfoodDocsSurfaceCell(`proof: ${dogfoodDocsSurfaceProofStatus(config.proofArtifacts)}`, 39)} |`,
      '+------------------------------------------------------------------+',
      'Intents: docs.navigate; docs.search; docs.openProof; docs.copyLink',
    ].join('\n'),
    facts,
  };
}

function renderStorybookWorkbenchBlock(
  input: BlockRenderInput<StorybookWorkbenchBlockConfig>,
): BlockRenderResult<string> {
  const storyCount = input.config?.storyCount ?? 0;
  const selectedStoryLabel = input.config?.selectedStoryLabel ?? 'none';
  const profileLabel = input.config?.profileLabel ?? 'default';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `StorybookWorkbench stories: ${storyCount}; selected: ${selectedStoryLabel}; profile: ${profileLabel}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'StorybookWorkbenchBlock' }],
    };
  }

  return {
    output: [
      'StorybookWorkbench',
      `stories: ${storyCount}`,
      `selected: ${selectedStoryLabel}`,
      `profile: ${profileLabel}`,
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'StorybookWorkbenchBlock' }],
  };
}

function renderTitleScreenBlock(
  input: BlockRenderInput<TitleScreenBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title ?? 'Bijou Docs';
  const subtitle = input.config?.subtitle ?? 'Blocks, components, localization, and terminal UI proof.';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `${title}: ${subtitle}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
    };
  }

  return {
    output: [
      title,
      subtitle,
      'Actions: open docs; open Storybook; open settings',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'TitleScreenBlock' }],
  };
}

function renderNavigationListBlock(
  input: BlockRenderInput<NavigationListBlockConfig>,
): BlockRenderResult<string> {
  const items = input.config?.items ?? [];
  const activeItemId = input.config?.activeItemId;
  const activeItem = items.find((item) => item.id === activeItemId);
  const itemCount = input.config?.itemCount ?? items.length;
  const activeLabel = input.config?.activeLabel ?? activeItem?.label ?? 'none';

  if (items.length > 0) {
    return {
      output: items
        .map((item) => {
          const marker = item.id === activeItemId ? '>' : '-';
          const indent = '  '.repeat(Math.max(0, Math.floor(item.depth ?? 0)));
          return `${indent}${marker} ${item.label}`;
        })
        .join('\n'),
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
        { kind: 'state', key: 'dogfood.navigation.itemCount', value: String(itemCount) },
      ],
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Navigation items: ${itemCount}; active: ${activeLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
        { kind: 'state', key: 'dogfood.navigation.itemCount', value: String(itemCount) },
      ],
    };
  }

  return {
    output: [
      'NavigationListBlock',
      `items: ${itemCount}`,
      `active: ${activeLabel}`,
      'Intents: select item; expand group; collapse group',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
      { kind: 'state', key: 'dogfood.navigation.itemCount', value: String(itemCount) },
    ],
  };
}

function renderDocumentationArticleBlock(
  input: BlockRenderInput<DocumentationArticleBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title ?? 'Untitled article';
  const body = input.config?.body;
  const headingCount = input.config?.headingCount ?? 0;
  const facts = [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'DocumentationArticleBlock' },
    { kind: 'state' as const, key: 'dogfood.documentation.headingCount', value: String(headingCount) },
  ];

  if (body !== undefined && (input.mode === 'interactive' || input.mode === 'static')) {
    return {
      output: body,
      facts,
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: body === undefined
        ? `Article: ${title}; headings: ${headingCount}`
        : `${title}: ${body.replace(/\s+/g, ' ').trim()}`,
      facts,
    };
  }

  return {
    output: [
      'DocumentationArticleBlock',
      `title: ${title}`,
      `headings: ${headingCount}`,
      'Intents: select heading; open reference',
    ].join('\n'),
    facts,
  };
}

function renderSettingsMenuRow(row: SettingsMenuBlockRow): readonly string[] {
  const value = row.valueLabel == null ? '' : `: ${row.valueLabel}`;
  const summary = `- ${row.label}${value}`;
  return row.description == null ? [summary] : [summary, `  ${row.description}`];
}

function renderSettingsMenuBlock(
  input: BlockRenderInput<SettingsMenuBlockConfig>,
): BlockRenderResult<string> {
  const sections = input.config?.sections ?? [];
  const sectionCount = input.config?.sectionCount ?? sections.length;
  const activeSettingLabel = input.config?.activeSettingLabel
    ?? sections.find((section) => section.rows.length > 0)?.rows[0]?.label
    ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    if (sections.length > 0) {
      return {
        output: sections.flatMap((section) => [
          section.title,
          ...section.rows.flatMap(renderSettingsMenuRow),
        ]).join('\n'),
        facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
      };
    }

    return {
      output: `Settings sections: ${sectionCount}; active: ${activeSettingLabel}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    };
  }

  if (sections.length > 0) {
    return {
      output: [
        'SettingsMenuBlock',
        ...sections.flatMap((section) => [
          section.title,
          ...section.rows.flatMap(renderSettingsMenuRow),
        ]),
      ].join('\n'),
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    };
  }

  return {
    output: [
      'SettingsMenuBlock',
      `sections: ${sectionCount}`,
      `active: ${activeSettingLabel}`,
      'Intents: activate row; set locale; set shell theme',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
  };
}

function renderSearchPanelBlock(
  input: BlockRenderInput<SearchPanelBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title;
  const query = input.config?.query ?? '';
  const resultCount = input.config?.resultCount ?? 0;
  const activeResultLabel = input.config?.activeResultLabel ?? 'none';
  const queryLabel = query.trim() === '' ? 'empty' : query;
  const titleOnly = title != null
    && query.trim() === ''
    && resultCount === 0
    && activeResultLabel === 'none';
  const facts = [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'SearchPanelBlock' },
    { kind: 'state' as const, key: 'dogfood.search.resultCount', value: String(resultCount) },
  ];

  if (titleOnly) {
    return {
      output: title,
      facts,
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Search query: ${queryLabel}; results: ${resultCount}; active: ${activeResultLabel}`,
      facts,
    };
  }

  return {
    output: [
      'SearchPanelBlock',
      `query: ${queryLabel}`,
      `results: ${resultCount}`,
      `active: ${activeResultLabel}`,
      'Intents: submit query; select result; dismiss',
    ].join('\n'),
    facts,
  };
}

function renderNotificationCenterBlock(
  input: BlockRenderInput<NotificationCenterBlockConfig>,
): BlockRenderResult<string> {
  const notificationCount = input.config?.notificationCount ?? 0;
  const activeFilterLabel = input.config?.activeFilterLabel ?? 'All';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Notification items: ${notificationCount}; filter: ${activeFilterLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' },
        { kind: 'state', key: 'dogfood.notifications.count', value: String(notificationCount) },
      ],
    };
  }

  return {
    output: [
      'NotificationCenterBlock',
      `items: ${notificationCount}`,
      `filter: ${activeFilterLabel}`,
      'Intents: dismiss notification; set filter',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' },
      { kind: 'state', key: 'dogfood.notifications.count', value: String(notificationCount) },
    ],
  };
}

function renderPerfHudBlock(
  input: BlockRenderInput<PerfHudBlockConfig>,
): BlockRenderResult<string> {
  const fps = input.config?.fps ?? 0;
  const frameMs = input.config?.frameMs ?? 0;
  const columns = input.config?.columns ?? 0;
  const rows = input.config?.rows ?? 0;
  const frameLabel = frameMs.toFixed(2).replace(/\.?0+$/, '');

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Perf HUD fps: ${fps}; frame: ${frameLabel} ms; size: ${columns}x${rows}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' },
        { kind: 'state', key: 'dogfood.perfHud.fps', value: String(fps) },
      ],
    };
  }

  return {
    output: [
      'PerfHudBlock',
      `fps: ${fps}`,
      `frame: ${frameLabel} ms`,
      `size: ${columns}x${rows}`,
      'Intents: toggle perf HUD',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' },
      { kind: 'state', key: 'dogfood.perfHud.fps', value: String(fps) },
    ],
  };
}

function renderHelpOverlayBlock(
  input: BlockRenderInput<HelpOverlayBlockConfig>,
): BlockRenderResult<string> {
  const bindingCount = input.config?.bindingCount ?? 0;
  const scopeLabel = input.config?.scopeLabel ?? 'workspace';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Help scope: ${scopeLabel}; bindings: ${bindingCount}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' },
        { kind: 'state', key: 'dogfood.help.bindingCount', value: String(bindingCount) },
      ],
    };
  }

  return {
    output: [
      'HelpOverlayBlock',
      `scope: ${scopeLabel}`,
      `bindings: ${bindingCount}`,
      'Intents: dismiss help',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' },
      { kind: 'state', key: 'dogfood.help.bindingCount', value: String(bindingCount) },
    ],
  };
}

function renderCommandPaletteBlock(
  input: BlockRenderInput<CommandPaletteBlockConfig>,
): BlockRenderResult<string> {
  const commandCount = input.config?.commandCount ?? 0;
  const activeCommandLabel = input.config?.activeCommandLabel ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Command palette commands: ${commandCount}; active: ${activeCommandLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'CommandPaletteBlock' },
        { kind: 'state', key: 'dogfood.commandPalette.commandCount', value: String(commandCount) },
      ],
    };
  }

  return {
    output: [
      'CommandPaletteBlock',
      `commands: ${commandCount}`,
      `active: ${activeCommandLabel}`,
      'Intents: execute command; dismiss command palette',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'CommandPaletteBlock' },
      { kind: 'state', key: 'dogfood.commandPalette.commandCount', value: String(commandCount) },
    ],
  };
}

function renderFooterHintBlock(
  input: BlockRenderInput<FooterHintBlockConfig>,
): BlockRenderResult<string> {
  const parts = [
    input.config?.controls,
    input.config?.activeHint,
    input.config?.status,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => part != null && part !== '');
  const output = parts.length > 0 ? parts.join(' • ') : 'No footer hints';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
    };
  }

  return {
    output: [
      'FooterHintBlock',
      output,
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'FooterHintBlock' }],
  };
}

function renderBlockPreviewBlock(
  input: BlockRenderInput<BlockPreviewBlockConfig>,
): BlockRenderResult<string> {
  const blockName = input.config?.blockName ?? 'none';
  const modeCount = input.config?.modeCount ?? 0;

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Block preview: ${blockName}; modes: ${modeCount}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
    };
  }

  return {
    output: [
      'BlockPreviewBlock',
      `block: ${blockName}`,
      `modes: ${modeCount}`,
      'Intents: select block; cycle mode',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockPreviewBlock' }],
  };
}

function renderGuideInspectorBlock(
  input: BlockRenderInput<GuideInspectorBlockConfig>,
): BlockRenderResult<string> {
  const selectionLabel = input.config?.selectionLabel ?? 'none';
  const sections = input.config?.sections ?? [];
  const factCount = input.config?.factCount ?? sections.length;

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    if (sections.length > 0) {
      return {
        output: [
          `Guide inspector: ${selectionLabel}`,
          ...sections.map((section) => `${section.title}: ${section.content}`),
        ].join('\n'),
        facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
      };
    }

    return {
      output: `Guide inspector: ${selectionLabel}; facts: ${factCount}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    };
  }

  if (sections.length > 0) {
    return {
      output: [
        'GuideInspectorBlock',
        `selection: ${selectionLabel}`,
        ...sections.flatMap((section) => [
          `${section.title}:`,
          section.content,
        ]),
      ].join('\n'),
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
    };
  }

  return {
    output: [
      'GuideInspectorBlock',
      `selection: ${selectionLabel}`,
      `facts: ${factCount}`,
      'Intents: open source; focus section',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'GuideInspectorBlock' }],
  };
}

function dogfoodBlockKey(packageName: string, blockName: string): string {
  return `${packageName}/${blockName}`;
}

function normalizeDogfoodDocsSurfaceConfig(
  config: DogfoodDocsSurfaceBlockConfig | undefined,
): DogfoodDocsSurfaceSchemaData {
  const selectedRoute = config?.selectedRoute ?? 'docs';
  const selectedHeadingId = config?.selectedHeadingId ?? selectedRoute;
  return {
    docsTree: config?.docsTree ?? [],
    selectedRoute,
    ...(config?.selectedRouteLabel === undefined ? {} : { selectedRouteLabel: config.selectedRouteLabel }),
    selectedHeadingId,
    searchState: config?.searchState ?? { query: '', hitCount: 0 },
    proofArtifacts: config?.proofArtifacts ?? [],
  };
}

function dogfoodDocsSurfaceFacts(
  config: DogfoodDocsSurfaceBlockConfig,
) {
  const normalized = normalizeDogfoodDocsSurfaceConfig(config);
  return [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' },
    { kind: 'entity' as const, key: 'route', value: normalized.selectedRoute },
    { kind: 'entity' as const, key: 'heading-id', value: normalized.selectedHeadingId },
    { kind: 'count' as const, key: 'search-hit-count', value: normalized.searchState.hitCount },
    { kind: 'entity' as const, key: 'proof-artifact', value: dogfoodDocsSurfaceProofLabel(normalized.proofArtifacts) },
  ];
}

function dogfoodDocsSurfaceProofLabel(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
): string {
  const available = artifacts
    .filter((artifact) => artifact.available)
    .map((artifact) => artifact.label);
  return available.length === 0 ? 'none' : available.join(', ');
}

function dogfoodDocsSurfaceProofStatus(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
): string {
  const label = dogfoodDocsSurfaceProofLabel(artifacts);
  return label === 'none' ? 'none' : `${label} available`;
}

function dogfoodDocsSurfaceSelectedNavLabel(config: DogfoodDocsSurfaceSchemaData): string {
  const selectedLabel = config.selectedRouteLabel ?? config.selectedRoute;
  return `> ${selectedLabel}`;
}

function dogfoodDocsSurfaceCell(value: string, width: number): string {
  return value.slice(0, width).padEnd(width);
}

function dogfoodDocsSurfaceNavLabel(
  config: DogfoodDocsSurfaceSchemaData,
  index: number,
): string {
  const selectedLabel = config.selectedRouteLabel ?? config.selectedRoute;
  const remainingLabels = config.docsTree.filter((label) => label !== selectedLabel);
  const label = remainingLabels[index - 1] ?? '';
  if (label.length === 0) {
    return '';
  }

  return `  ${label}`;
}

function parseDogfoodDocsSurfaceSchemaData(input: unknown): DogfoodDocsSurfaceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const docsTree = textArrayProperty(input, 'docsTree');
  const selectedRoute = textProperty(input, 'selectedRoute');
  const selectedRouteLabel = textProperty(input, 'selectedRouteLabel');
  const selectedHeadingId = textProperty(input, 'selectedHeadingId');
  const searchState = parseDogfoodDocsSurfaceSearchState(ownDataProperty(input, 'searchState'));
  const proofArtifacts = parseDogfoodDocsSurfaceProofArtifacts(ownDataProperty(input, 'proofArtifacts'));

  if (
    docsTree === undefined
    || selectedRoute === undefined
    || selectedHeadingId === undefined
    || searchState === undefined
    || proofArtifacts === undefined
  ) {
    return undefined;
  }

  return {
    docsTree,
    selectedRoute,
    ...(selectedRouteLabel === undefined ? {} : { selectedRouteLabel }),
    selectedHeadingId,
    searchState,
    proofArtifacts,
  };
}

function parseDogfoodDocsSurfaceSearchState(input: unknown): DogfoodDocsSurfaceSearchState | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const query = textProperty(input, 'query');
  const hitCount = numberProperty(input, 'hitCount');
  if (query === undefined || hitCount === undefined) {
    return undefined;
  }

  return { query, hitCount };
}

function parseDogfoodDocsSurfaceProofArtifacts(
  input: unknown,
): readonly DogfoodDocsSurfaceProofArtifact[] | undefined {
  const values = dataArrayValues(input);
  if (values === undefined) {
    return undefined;
  }

  const artifacts = values.map(parseDogfoodDocsSurfaceProofArtifact);
  return artifacts.every((artifact): artifact is DogfoodDocsSurfaceProofArtifact => artifact !== undefined)
    ? artifacts
    : undefined;
}

function parseDogfoodDocsSurfaceProofArtifact(input: unknown): DogfoodDocsSurfaceProofArtifact | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const id = textProperty(input, 'id');
  const label = textProperty(input, 'label');
  const available = booleanProperty(input, 'available');
  if (id === undefined || label === undefined || available === undefined) {
    return undefined;
  }

  return { id, label, available };
}

function schemaError<Data = never>(code: string, message: string): BlockSchemaResult<Data> {
  return {
    ok: false,
    issues: [{
      severity: 'error',
      code,
      message,
    }],
  };
}

function normalizeDogfoodBlockRole(role: DogfoodBlockRole): DogfoodBlockRole {
  const normalized = normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'role',
    value: role,
  }) as DogfoodBlockRole;

  if (!DOGFOOD_BLOCK_ROLES.includes(normalized)) {
    throw new Error(`dogfood block registry entry: unsupported role ${String(role)}`);
  }

  return normalized;
}

function normalizeRequiredText(input: {
  readonly scope: string;
  readonly field: string;
  readonly value: unknown;
}): string {
  if (typeof input.value !== 'string') {
    throw new Error(`${input.scope}: ${input.field} must be a string`);
  }

  const value = input.value.trim();
  if (value === '') {
    throw new Error(`${input.scope}: ${input.field} is required`);
  }

  return value;
}

function optionalTrimmedText(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'description',
    value,
  });
}

function isPlainRecord(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

function ownDataProperty(input: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function textProperty(input: Record<string, unknown>, key: string): string | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' ? value : undefined;
}

function numberProperty(input: Record<string, unknown>, key: string): number | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function booleanProperty(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'boolean' ? value : undefined;
}

function textArrayProperty(input: Record<string, unknown>, key: string): readonly string[] | undefined {
  const value = ownDataProperty(input, key);
  const values = dataArrayValues(value);
  return values !== undefined && values.every((item) => typeof item === 'string')
    ? values
    : undefined;
}

function dataArrayValues(input: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const values: unknown[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (descriptor === undefined || !('value' in descriptor)) {
      return undefined;
    }
    values.push(descriptor.value);
  }
  return values;
}

interface DogfoodBlockRegistryEntryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]?: true;
}

interface DogfoodBlockRegistryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]?: true;
}
