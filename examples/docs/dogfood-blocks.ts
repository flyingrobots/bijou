import {
  commandIntent,
  defineBlock,
  defineDataRequirement,
  defineViewData,
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderInput,
  type BlockRenderResult,
  type OutputMode,
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
  'settings',
  'inspector',
  'preview',
  'workbench',
  'fixture',
]);

export type DogfoodBlockDefinition = BlockDefinition<never, unknown>;

export type DogfoodBlockRole =
  | 'app-shell'
  | 'title'
  | 'navigation'
  | 'article'
  | 'settings'
  | 'inspector'
  | 'preview'
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

export interface SettingsMenuBlockConfig {
  readonly sectionCount?: number;
  readonly activeSettingLabel?: string;
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

export const requiredDogfoodBlockSurfaceIds: readonly string[] = Object.freeze([
  'landing.title',
  'docs.navigation',
  'docs.article',
  'blocks.preview',
  'guide.inspector',
  'frame.settings',
  'storybook.workbench',
]);

export const defaultDogfoodBlockRegistry = dogfoodBlockRegistry([
  titleScreenBlockRegistryEntry,
  navigationListBlockRegistryEntry,
  documentationArticleBlockRegistryEntry,
  blockPreviewBlockRegistryEntry,
  guideInspectorBlockRegistryEntry,
  settingsMenuBlockRegistryEntry,
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

  if (body !== undefined && (input.mode === 'interactive' || input.mode === 'static')) {
    return {
      output: body,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' },
        { kind: 'state', key: 'dogfood.documentation.headingCount', value: String(headingCount) },
      ],
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: body === undefined
        ? `Article: ${title}; headings: ${headingCount}`
        : `${title}: ${body.replace(/\s+/g, ' ').trim()}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' },
        { kind: 'state', key: 'dogfood.documentation.headingCount', value: String(headingCount) },
      ],
    };
  }

  return {
    output: [
      'DocumentationArticleBlock',
      `title: ${title}`,
      `headings: ${headingCount}`,
      'Intents: select heading; open reference',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
  };
}

function renderSettingsMenuBlock(
  input: BlockRenderInput<SettingsMenuBlockConfig>,
): BlockRenderResult<string> {
  const sectionCount = input.config?.sectionCount ?? 0;
  const activeSettingLabel = input.config?.activeSettingLabel ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Settings sections: ${sectionCount}; active: ${activeSettingLabel}`,
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

interface DogfoodBlockRegistryEntryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]?: true;
}

interface DogfoodBlockRegistryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]?: true;
}
