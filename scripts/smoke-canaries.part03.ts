import { tail } from './smoke-canaries.part01.js';
import { collapseWhitespace, compactWhitespace } from './smoke-canaries.part02.js';

function assertCheckpointContains(
  checkpoints: ReadonlyMap<string, string>,
  label: string,
  expected: readonly string[],
): void {
  const segment = checkpoints.get(label);
  if (segment == null) {
    throw new Error(`missing PTY checkpoint "${label}"`);
  }

  const compactSegment = compactWhitespace(segment);
  const collapsedSegment = collapseWhitespace(segment);
  const missing = expected.filter((needle) => {
    const compactNeedle = compactWhitespace(needle);
    if (compactSegment.includes(compactNeedle)) return false;
    return !collapsedSegment.includes(collapseWhitespace(needle));
  });
  if (missing.length > 0) {
    throw new Error(`checkpoint "${label}" missing expected text: ${missing.join(', ')}\n${tail(segment)}`);
  }
}

function assertCheckpointAbsent(
  checkpoints: ReadonlyMap<string, string>,
  label: string,
  forbidden: readonly string[],
): void {
  const segment = checkpoints.get(label);
  if (segment == null) {
    throw new Error(`missing PTY checkpoint "${label}"`);
  }

  const compactSegment = compactWhitespace(segment);
  const collapsedSegment = collapseWhitespace(segment);
  const present = forbidden.filter((needle) => {
    const compactNeedle = compactWhitespace(needle);
    if (compactSegment.includes(compactNeedle)) return true;
    return collapsedSegment.includes(collapseWhitespace(needle));
  });
  if (present.length > 0) {
    throw new Error(`checkpoint "${label}" unexpectedly contained: ${present.join(', ')}\n${tail(segment)}`);
  }
}

export { assertCheckpointAbsent, assertCheckpointContains };
