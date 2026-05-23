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

export const defaultDogfoodBlockRegistry = dogfoodBlockRegistry([
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
