import type { BlockRenderInput, BlockRenderResult } from '../block-metadata.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardBlockName } from './types.js';
import { normalizeOutputMode, renderAccessibleSections, renderPipeSections, renderSurfaceBounds, renderVisualSectionsSurface } from './render.part01.js';
import type { RenderSection } from './render.part01.js';
import { renderFacts } from './render.part02.js';
import { ownSlotValue, renderSection, renderedBlockResult } from './render.part03.js';

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

interface StandardSectionSpec {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
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
