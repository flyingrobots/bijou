import type { BindingFact } from '../binding.js';
import { isBlockDefinition, type BlockRenderInput, type BlockRenderResult } from '../block-metadata.js';
import type { Surface } from '../../ports/surface.js';
import { isPlainRecord } from './schema-utils.js';
import { normalizeOutputMode, renderAccessibleSections, renderPipeSections, renderSurfaceBounds, renderVisualSectionsSurface } from './render.part01.js';
import type { RenderSection } from './render.part01.js';
import { isSurfaceSlotValue, renderFacts, surfaceSlotText } from './render.part02.js';

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

function slotValueVisualContent(value: unknown, textContent: string | undefined): string | Surface | undefined {
  if (isSurfaceSlotValue(value)) {
    return value;
  }

  return textContent;
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

function ownSlotValue(slots: Readonly<Record<string, unknown>> | undefined, key: string): unknown {
  if (!isPlainRecord(slots)) {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(slots, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

interface RenderedBlockOptions {
  readonly output: string | Surface;
  readonly facts: readonly BindingFact[];
}

function renderedBlockResult(options: RenderedBlockOptions): BlockRenderResult<string | Surface> {
  const facts = Object.freeze(options.facts.map((fact) => Object.freeze({ ...fact })));
  return Object.freeze({
    output: options.output,
    facts,
  });
}

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

export { ownSlotValue, renderSection, renderedBlockResult };
