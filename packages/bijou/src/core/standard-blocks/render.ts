import type { BindingFact } from '../binding.js';
import { isBlockDefinition, type BlockRenderInput, type BlockRenderResult } from '../block-metadata.js';
import type { OutputMode } from '../detect/tty.js';
import { boxSurface } from '../components/box-v3.js';
import { createTextSurface } from '../components/surface-text.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { ALL_OUTPUT_MODES, type StandardBlockName } from './types.js';
import { isPlainRecord, ownDataProperty } from './schema-utils.js';

export function renderAppShellBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('navigation', 'Navigation', ownSlotValue(input.slots, 'navigation'), false),
    renderSection('content', 'Content', ownSlotValue(input.slots, 'content'), true),
    renderSection('inspector', 'Inspector', ownSlotValue(input.slots, 'inspector'), false),
    renderSection('status', 'Status', ownSlotValue(input.slots, 'status'), false),
    renderSection('overlays', 'Overlays', ownSlotValue(input.slots, 'overlays'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('AppShell', sections)
      : mode === 'pipe'
        ? renderPipeSections('AppShell', sections)
        : renderVisualSectionsSurface('AppShell', sections, renderSurfaceBounds(input)),
    facts: renderFacts('AppShell', sections, 'region', mode),
  });
}

export function renderReaderSurfaceBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('navigation', 'Navigation', ownSlotValue(input.slots, 'navigation'), false),
    renderSection('content', 'Content', ownSlotValue(input.slots, 'content'), true),
    renderSection('outline', 'Outline', ownSlotValue(input.slots, 'outline'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('ReaderSurface', sections)
      : mode === 'pipe'
        ? renderPipeSections('ReaderSurface', sections)
        : renderVisualSectionsSurface('ReaderSurface', sections, renderSurfaceBounds(input)),
    facts: renderFacts('ReaderSurface', sections, 'slot', mode),
  });
}

export function renderInspectorPanelBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('selection', 'Selection', ownSlotValue(input.slots, 'selection'), true),
    renderSection('details', 'Details', ownSlotValue(input.slots, 'details'), false),
    renderSection('actions', 'Actions', ownSlotValue(input.slots, 'actions'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('InspectorPanel', sections)
      : mode === 'pipe'
        ? renderPipeSections('InspectorPanel', sections)
        : renderVisualSectionsSurface('InspectorPanel', sections, renderSurfaceBounds(input)),
    facts: renderFacts('InspectorPanel', sections, 'slot', mode),
  });
}

export function renderStandardSectionBlock(
  input: BlockRenderInput,
  blockName: StandardBlockName,
  sectionSpecs: readonly StandardSectionSpec[],
): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections = sectionSpecs
    .map((section) => renderSection(
      section.id,
      section.label,
      ownSlotValue(input.slots, section.id),
      section.required,
    ))
    .filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections(blockName, sections)
      : mode === 'pipe'
        ? renderPipeSections(blockName, sections)
        : renderVisualSectionsSurface(blockName, sections, renderSurfaceBounds(input)),
    facts: renderFacts(blockName, sections, 'slot', mode),
  });
}

interface StandardSectionSpec {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}

interface RenderSection {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly visualContent: string | Surface;
  readonly required: boolean;
  readonly present: boolean;
}

interface RenderedBlockOptions {
  readonly output: string | Surface;
  readonly facts: readonly BindingFact[];
}

interface RenderSurfaceBounds {
  readonly width: number;
  readonly sectionHeight?: number;
}

function renderedBlockResult(options: RenderedBlockOptions): BlockRenderResult<string | Surface> {
  const facts = Object.freeze(options.facts.map((fact) => Object.freeze({ ...fact })));
  return Object.freeze({
    output: options.output,
    facts,
  });
}

function renderSection(
  id: string,
  label: string,
  value: unknown,
  required: boolean,
): RenderSection {
  const content = slotValueText(value);
  const visualContent = slotValueVisualContent(value, content);
  const present = content !== undefined || visualContent !== undefined;
  const fallbackContent = required ? `(missing required ${id})` : '';
  return Object.freeze({
    id,
    label,
    content: content ?? fallbackContent,
    visualContent: visualContent ?? fallbackContent,
    required,
    present,
  });
}

function renderPipeSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.id, section.content)),
  ].join('\n');
}

function renderAccessibleSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.label, section.content)),
  ].join('\n');
}

function renderVisualSectionsSurface(
  blockName: StandardBlockName,
  sections: readonly RenderSection[],
  bounds: RenderSurfaceBounds,
): Surface {
  const safeWidth = Math.max(30, Math.floor(bounds.width));
  const sectionWidth = Math.max(24, safeWidth - 4);
  const sectionContentWidth = Math.max(1, sectionWidth - 4);
  const sectionSurfaces = sections.map((section) => {
    const content = fitVisualContent(section.visualContent, sectionContentWidth, bounds.sectionHeight);
    return boxSurface(content, {
      title: section.label,
      width: sectionWidth,
      padding: { left: 1, right: 1 },
    });
  });

  return boxSurface(stackSurfaces(sectionSurfaces, 1), {
    title: blockName,
    width: safeWidth,
    padding: { left: 1, right: 1 },
  });
}

function formatSectionLine(label: string, content: string): string {
  if (content.includes('\n')) {
    return `${label}:\n${indentBlock(content)}`;
  }

  return `${label}: ${content}`;
}

function indentBlock(content: string): string {
  return content
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function renderFacts(
  blockName: StandardBlockName,
  sections: readonly RenderSection[],
  sectionFactPrefix: 'region' | 'slot',
  mode: OutputMode,
): readonly BindingFact[] {
  const identity = standardBlockRenderIdentity(blockName);
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block', value: blockName },
    { kind: 'state', key: 'block.rendered', value: true },
    { kind: 'entity', key: 'block.family', value: identity.family },
    { kind: 'state', key: 'block.variant', value: identity.variant },
    { kind: 'state', key: 'block.mode', value: mode, required: false },
  ];
  const selectedSection = sections.find((section) => section.id === 'selected' && section.present);
  if (selectedSection !== undefined) {
    facts.push({ kind: 'entity', key: 'block.selected', value: selectedSection.content });
  }

  for (const section of sections) {
    if (section.present) {
      facts.push({
        kind: 'entity',
        key: `${sectionFactPrefix}.${section.id}`,
        value: 'present',
      });
      facts.push({
        kind: 'label',
        key: `${sectionFactPrefix}.${section.id}.value`,
        value: section.content,
      });
      facts.push({
        kind: 'label',
        key: `semanticValue.${section.id}`,
        value: section.content,
      });
    }
  }

  return facts;
}

interface StandardBlockRenderIdentity {
  readonly family: string;
  readonly variant: string;
}

function standardBlockRenderIdentity(blockName: StandardBlockName): StandardBlockRenderIdentity {
  switch (blockName) {
    case 'AppShell':
      return { family: 'app-structure', variant: 'wide' };
    case 'ReaderSurface':
      return { family: 'content-reading', variant: 'article' };
    case 'InspectorPanel':
      return { family: 'inspection', variant: 'selection' };
    case 'InlineStatusBlock':
    case 'InFlowStatusBlock':
      return { family: 'status', variant: 'ready' };
    case 'TransientOverlayBlock':
      return { family: 'overlay', variant: 'ready' };
    case 'ActivityStreamBlock':
      return { family: 'activity', variant: 'ready' };
    case 'ShortcutCueBlock':
      return { family: 'shortcut', variant: 'ready' };
    case 'ProgressIndicatorBlock':
      return { family: 'progress', variant: 'ready' };
    case 'FramedGroupBlock':
      return { family: 'grouping', variant: 'ready' };
    case 'ExplainabilityWalkthroughBlock':
      return { family: 'explainability', variant: 'ready' };
    case 'FormattedDocumentBlock':
      return { family: 'document', variant: 'ready' };
    case 'LinkDestinationBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'DividerBlock':
      return { family: 'structure', variant: 'ready' };
    case 'TextEntryBlock':
      return { family: 'input', variant: 'ready' };
    case 'SingleChoiceBlock':
    case 'MultipleChoiceBlock':
    case 'BinaryDecisionBlock':
      return { family: 'input', variant: 'ready' };
    case 'PeerNavigationBlock':
    case 'PathProgressBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'ProgressiveDisclosureBlock':
      return { family: 'disclosure', variant: 'ready' };
    case 'BrandEmphasisBlock':
      return { family: 'branding', variant: 'ready' };
    case 'ModeAwarePrimitiveBlock':
      return { family: 'primitive', variant: 'ready' };
    case 'DenseComparisonBlock':
      return { family: 'comparison', variant: 'ready' };
    case 'HierarchyBlock':
      return { family: 'hierarchy', variant: 'ready' };
    case 'ExplorationListBlock':
      return { family: 'list', variant: 'ready' };
    case 'TemporalDependencyBlock':
      return { family: 'graph', variant: 'ready' };
  }
}

function normalizeOutputMode(mode: OutputMode | undefined): OutputMode {
  return mode && ALL_OUTPUT_MODES.includes(mode) ? mode : 'interactive';
}

function renderSurfaceBounds(input: BlockRenderInput): RenderSurfaceBounds {
  const config = input.config;
  let width = 78;
  let sectionHeight: number | undefined;
  if (isPlainRecord(config)) {
    const widthValue = ownDataProperty(config, 'width');
    if (typeof widthValue === 'number' && Number.isFinite(widthValue)) {
      width = Math.max(30, Math.min(120, Math.floor(widthValue)));
    }

    const sectionHeightValue = ownDataProperty(config, 'sectionHeight');
    if (typeof sectionHeightValue === 'number' && Number.isFinite(sectionHeightValue)) {
      sectionHeight = Math.max(1, Math.min(40, Math.floor(sectionHeightValue)));
    }
  }

  return sectionHeight === undefined ? { width } : { width, sectionHeight };
}

function stackSurfaces(surfaces: readonly Surface[], gap = 0): Surface {
  if (surfaces.length === 0) {
    return createTextSurface('');
  }

  const safeGap = Math.max(0, Math.floor(gap));
  const width = Math.max(1, ...surfaces.map((surface) => surface.width));
  const height = surfaces.reduce((sum, surface) => sum + surface.height, 0)
    + (safeGap * Math.max(0, surfaces.length - 1));
  const result = createSurface(width, height);
  let y = 0;

  surfaces.forEach((surface, index) => {
    if (index > 0) {
      y += safeGap;
    }
    result.blit(surface, 0, y);
    y += surface.height;
  });

  return result;
}

function ownSlotValue(slots: Readonly<Record<string, unknown>> | undefined, key: string): unknown {
  if (!isPlainRecord(slots)) {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(slots, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

export function slotValueText(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (isSurfaceSlotValue(value)) {
    return surfaceSlotText(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => slotValueText(item))
      .filter((item): item is string => item !== undefined && item.trim() !== '');
    return parts.length === 0 ? undefined : parts.join('; ');
  }

  if (isBlockDefinition(value)) {
    return value.metadata.blockName;
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return recordSlotText(value);
  return undefined;
}

function slotValueVisualContent(value: unknown, textContent: string | undefined): string | Surface | undefined {
  if (isSurfaceSlotValue(value)) {
    return value;
  }

  return textContent;
}

function isSurfaceSlotValue(value: unknown): value is Surface {
  if (value == null || typeof value !== 'object') return false;
  return 'width' in value && 'height' in value && 'get' in value
    && typeof value.width === 'number' && typeof value.height === 'number' && typeof value.get === 'function';
}

function surfaceSlotText(surface: Surface): string | undefined {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char || ' ';
    }
    lines.push(line.trimEnd());
  }

  const text = lines.join('\n').trim();
  return text === '' ? undefined : text;
}

function recordSlotText(value: object): string | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(Object.getOwnPropertyDescriptors(value))
    .flatMap(([key, descriptor]) => {
      if (!('value' in descriptor)) {
        return [];
      }

      const text = slotValueText(descriptor.value);
      return text === undefined ? [] : [`${key}: ${text}`];
    });
  return entries.length === 0 ? undefined : entries.join('; ');
}

function fitVisualContent(content: string | Surface, width: number, height?: number): string | Surface {
  if (typeof content === 'string') {
    return height === undefined ? content : content.split('\n').slice(0, height).join('\n');
  }

  const safeHeight = height === undefined ? content.height : Math.min(content.height, height);
  if (content.width <= width && content.height <= safeHeight) {
    return content;
  }

  const clipped = createSurface(width, safeHeight);
  clipped.blit(content, 0, 0);
  return clipped;
}
