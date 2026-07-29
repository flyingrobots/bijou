import { segmentSurfaceText } from './components/surface-text.js';
import { failPageTarget } from './profunctor-page-error.js';
import type { PlannedPageNode } from './profunctor-page-scene.js';

export function validatePageSceneBounds(
  plans: readonly PlannedPageNode[],
  rootNodeId: string,
  cols: number,
  rows: number,
): void {
  for (const plan of plans) {
    const regionPath = `${plan.node.pageNodeId}.region`;
    if (
      plan.region.x < 0
      || plan.region.y < 0
      || plan.region.width < 1
      || plan.region.height < 1
      || plan.region.x + plan.region.width > cols
      || plan.region.y + plan.region.height > rows
    ) {
      unsupported(
        regionPath,
        `region must fit within ${String(cols)}x${String(rows)} target`,
      );
    }
    for (const [index, line] of plan.lines.entries()) {
      const path = `${plan.node.pageNodeId}.lines[${String(index)}]`;
      if (/[\r\n\u2028\u2029]/u.test(line.text)) {
        unsupported(path, 'terminal inspection lines must not contain line breaks');
      }
      const width = segmentSurfaceText(line.text, path).length;
      if (width > cols) {
        unsupported(
          path,
          `line width ${String(width)} exceeds target width ${String(cols)}`,
        );
      }
      const y = plan.node.pageNodeId === rootNodeId
        ? index
        : plan.region.y + index;
      if (y >= rows) {
        unsupported(
          path,
          `line row ${String(y)} exceeds target row ${String(rows - 1)}`,
        );
      }
    }
  }
}

function unsupported(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_BLOCK_UNSUPPORTED', path, detail);
}
