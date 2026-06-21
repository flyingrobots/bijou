import { colorHex } from '@flyingrobots/bijou';

import type { ColorRef } from '@flyingrobots/bijou';

import type { DocsPageModel, DocsRootModel, LocaleCatalog } from './docs-preview-model-types.js';

import { V7_LANDING_WAKE_WAVES } from './docs-preview.test-support.part01.js';

import { expectedBijouLogoYOffset, expectedBijouSvgOverlay } from './docs-preview.test-support.part02.js';
export function landingWakeLayer(
  x: number,
  y: number,
  width: number,
  time: number,
  amplitudeScale: number,
): number {
  let edge = width / 4;
  const edges: number[] = [];

  for (const spec of V7_LANDING_WAKE_WAVES) {
    edge += stackedWakeWave(time, y, spec.seeds, spec.amps) * spec.scale * amplitudeScale;
    edges.push(edge);
  }

  for (let index = edges.length - 1; index >= 0; index--) {
    const edge = edges[index];
    if (edge !== undefined && x > edge) return index + 1;
  }

  return 0;
}
export function stackedWakeWave(
  time: number,
  y: number,
  seeds: readonly [number, number, number],
  amps: readonly [number, number, number],
): number {
  return (
    ((Math.sin(time + (y * seeds[0])) + 1) * amps[0])
    + ((Math.sin(time + (y * seeds[1])) + 1) * amps[1])
    + (Math.sin(time + (y * seeds[2])) * amps[2])
  );
}
export function matchingBijouSvgOverlayGlyphCount(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { char?: string; fg?: ColorRef };
}, timeMs: number): { readonly expected: number; readonly matched: number } {
  const overlay = expectedBijouSvgOverlay(frame.width, frame.height);
  let expected = 0;
  let matched = 0;

  for (let y = 0; y < overlay.mask.height; y++) {
    for (let x = 0; x < overlay.mask.width; x++) {
      const expectedChar = overlay.mask.get(x, y).char;
      if (expectedChar === ' ') continue;
      expected++;

      const actual = frame.get(overlay.left + x, overlay.top + y + expectedBijouLogoYOffset(x, overlay.mask.width, timeMs));
      if (actual.char === expectedChar && colorHex(actual.fg) != null) {
        matched++;
      }
    }
  }

  return { expected, matched };
}
export function cellsWithoutBackground(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { bg?: ColorRef; bgRGB?: readonly [number, number, number] };
}) {
  const missing: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      if (cell.bg == null && cell.bgRGB == null) {
        missing.push(`${String(x)},${String(y)}`);
      }
    }
  }
  return missing;
}
export function docsPageModel(model: DocsRootModel, pageId: string): DocsPageModel {
  const pageModel = model.docsModel.pageModels[pageId];
  if (pageModel == null) throw new Error(`Missing docs page: ${pageId}`);
  return pageModel;
}
export function activeDocsPageModel(model: DocsRootModel): DocsPageModel {
  return docsPageModel(model, model.docsModel.activePageId);
}
export function withLocaleValues(
  catalog: LocaleCatalog,
  locale: string,
  translate: (value: string, key: string) => string,
): LocaleCatalog {
  return {
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => {
      const source = entry.values[entry.sourceLocale];
      return {
        ...entry,
        values: {
          ...entry.values,
          ...(typeof source === 'string'
            ? { [locale]: translate(source, entry.key.id) }
            : {}),
        },
      };
    }),
  };
}
