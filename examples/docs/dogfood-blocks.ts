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
}

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

export const defaultDogfoodBlockRegistry = dogfoodBlockRegistry([
  titleScreenBlockRegistryEntry,
  navigationListBlockRegistryEntry,
  storybookWorkbenchBlockRegistryEntry,
]);

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
  const itemCount = input.config?.itemCount ?? 0;
  const activeLabel = input.config?.activeLabel ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Navigation items: ${itemCount}; active: ${activeLabel}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
    };
  }

  return {
    output: [
      'NavigationListBlock',
      `items: ${itemCount}`,
      `active: ${activeLabel}`,
      'Intents: select item; expand group; collapse group',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' }],
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
