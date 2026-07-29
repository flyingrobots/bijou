import type { BlockRenderInput } from '../block-metadata.js';
import type { OutputMode } from '../detect/tty.js';
import { boxSurface } from '../components/box-v3.js';
import { createTextSurface } from '../components/surface-text.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { ALL_OUTPUT_MODES, type StandardBlockName } from './types.js';
import { isPlainRecord, ownDataProperty } from './schema-utils.js';

function normalizeOutputMode(mode: OutputMode | undefined): OutputMode {
  return mode && ALL_OUTPUT_MODES.includes(mode) ? mode : 'interactive';
}

interface RenderSection {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly visualContent: string | Surface;
  readonly required: boolean;
  readonly present: boolean;
}

function indentBlock(content: string): string {
  return content
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function formatSectionLine(label: string, content: string): string {
  if (content.includes('\n')) {
    return `${label}:\n${indentBlock(content)}`;
  }

  return `${label}: ${content}`;
}

function renderAccessibleSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.label, section.content)),
  ].join('\n');
}

function renderPipeSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.id, section.content)),
  ].join('\n');
}

interface RenderSurfaceBounds {
  readonly width: number;
  readonly sectionHeight?: number;
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

export type { RenderSection };
export { normalizeOutputMode, renderAccessibleSections, renderPipeSections, renderSurfaceBounds, renderVisualSectionsSurface };
