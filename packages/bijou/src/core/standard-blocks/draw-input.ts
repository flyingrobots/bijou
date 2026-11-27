import type { Surface } from '../../ports/surface.js';
import type { RenderSection, RenderSurfaceBounds } from './render.part01.js';

/** What a standard block's own `interactive` drawing receives. */
export interface StandardDrawInput {
  /** The block's slots as sections: required ones always, optional ones when present. */
  readonly sections: readonly RenderSection[];
  /** The raw slot values, for drawings that need lists or numbers. */
  readonly slots: Readonly<Record<string, unknown>> | undefined;
  /** The width (30 to 120 columns) and optional section height the caller asked for. */
  readonly bounds: RenderSurfaceBounds;
}

/**
 * Draws a standard block's `interactive` Surface from its sections. `static` mode
 * uses the same drawing, because it shows the interactive frame without motion.
 */
export type StandardInteractiveDrawer = (input: StandardDrawInput) => Surface;

/** The text of section `id`, or undefined when the block omits that optional slot. */
export function sectionContent(sections: readonly RenderSection[], id: string): string | undefined {
  return sections.find((section) => section.id === id)?.content;
}
