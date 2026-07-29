import {
  expectExactKeys,
  expectIntegerAtLeast,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import {
  expectRecord,
  type JsonRecord,
} from './profunctor-page-json.js';

interface SourcePosition {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export function validateSpan(span: JsonRecord, path: string): void {
  expectExactKeys(span, path, ['start', 'end']);
  const start = validatePosition(
    expectRecord(span.start, `${path}.start`),
    `${path}.start`,
  );
  const end = validatePosition(
    expectRecord(span.end, `${path}.end`),
    `${path}.end`,
  );
  if (
    end.offset < start.offset
    || end.line < start.line
    || (end.line === start.line && end.column < start.column)
  ) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
      `${path}.end`,
      'end position must not precede start position',
    );
  }
}

function validatePosition(
  position: JsonRecord,
  path: string,
): SourcePosition {
  expectExactKeys(position, path, ['offset', 'line', 'column']);
  return {
    offset: expectIntegerAtLeast(position.offset, `${path}.offset`, 0),
    line: expectIntegerAtLeast(position.line, `${path}.line`, 1),
    column: expectIntegerAtLeast(position.column, `${path}.column`, 1),
  };
}
