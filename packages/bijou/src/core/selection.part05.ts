import type { MixedSelectionContentModel, SelectionContentModel, SelectionOwner, SelectionPoint, SelectionRange } from './selection.part01.js';

import { extractSelectionText } from './selection.part03.js';

import { childRangeForRegion, freezeRect, normalizePoint, normalizeRect, normalizeRequiredText } from './selection.part06.js';

import { clamp } from './selection.part07.js';
export function extractMixedSelection(
  content: MixedSelectionContentModel,
  range: SelectionRange,
): string {
  const selectedText = content.regions.flatMap((region) => {
    const childRange = childRangeForRegion(range, region);
    if (childRange === undefined) {
      return [];
    }

    const text = extractSelectionText(region.content, childRange);
    return text.length === 0 ? [] : [text];
  });

  return selectedText.join(content.separator ?? '\n');
}
export function screenPointToContentPoint(owner: SelectionOwner, point: SelectionPoint): SelectionPoint {
  const normalizedPoint = normalizePoint(point);
  const clampedScreenX = clamp(
    normalizedPoint.x,
    owner.rect.x,
    owner.rect.x + owner.rect.width - 1,
  );
  const clampedScreenY = clamp(
    normalizedPoint.y,
    owner.rect.y,
    owner.rect.y + owner.rect.height - 1,
  );

  return Object.freeze({
    x: clampedScreenX - owner.rect.x + owner.viewport.scrollX,
    y: clampedScreenY - owner.rect.y + owner.viewport.scrollY,
  });
}
export function freezeContentModel(content: SelectionContentModel): SelectionContentModel {
  const kind = Reflect.get(content, 'kind');
  if (!/^(prose|surface|table|mixed)$/.test(kind)) throw new Error(`bad selection kind ${kind}`);
  if (content.kind === 'prose') {
    return Object.freeze({
      kind: 'prose',
      paragraphs: Object.freeze([...content.paragraphs]),
    });
  }
  if (content.kind === 'surface') {
    return Object.freeze({
      kind: 'surface',
      lines: Object.freeze([...content.lines]),
    });
  }
  if (content.kind === 'table') {
    return Object.freeze({
      kind: 'table',
      rows: Object.freeze(content.rows.map((row) => Object.freeze([...row]))),
      delimiter: content.delimiter,
    });
  }
  return Object.freeze({
    kind: 'mixed',
    regions: Object.freeze(content.regions.map((region) => Object.freeze({
      id: normalizeRequiredText({
        scope: 'selection content region',
        field: 'id',
        value: region.id,
      }),
      rect: freezeRect(normalizeRect(region.rect)),
      content: freezeContentModel(region.content),
    }))),
    separator: content.separator,
  });
}
