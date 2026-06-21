import { COORD_SEPARATOR } from './layout-inspector.part01.js';

import type { LayoutInspectorRect, LayoutInspectorScroll } from './layout-inspector.part01.js';
export function scrollLabel(scroll: LayoutInspectorScroll): string {
  return [scroll.x,COORD_SEPARATOR,scroll.y].join('');
}
export function rectColumn(rect: LayoutInspectorRect): number {
  return 'x' in rect ? rect.x : rect.col;
}
export function rectRow(rect: LayoutInspectorRect): number {
  return 'y' in rect ? rect.y : rect.row;
}
