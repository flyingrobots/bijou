import type { Surface } from '../ports/surface.js';
import { hashStableJson, stableJsonStringify } from './stable-json.js';

export function stableUiSceneStringify(value: unknown): string {
  return stableJsonStringify(value, 'ui-scene-ir/1');
}

export function hashUiSceneValue(value: unknown): string {
  return hashStableJson(value, 'ui-scene-ir/1');
}

export function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

export function hashUiSceneSurface(surface: Surface): string {
  const cells = [];
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      cells.push({
        bg: cell.bg,
        bgRGB: cell.bgRGB,
        char: cell.char,
        empty: cell.empty,
        fg: cell.fg,
        fgRGB: cell.fgRGB,
        modifiers: cell.modifiers,
        opacity: cell.opacity,
      });
    }
  }
  return hashUiSceneValue({
    cells,
    height: surface.height,
    width: surface.width,
  });
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
