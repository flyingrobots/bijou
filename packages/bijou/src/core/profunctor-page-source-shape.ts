import {
  expectContractId,
  expectDigest,
  expectExactKeys,
  expectIntegerAtLeast,
  expectKebabCase,
  expectNonWhitespaceString,
  expectRepositoryPath,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import {
  expectRecord,
  expectString,
  expectStrings,
  type JsonRecord,
} from './profunctor-page-json.js';
import { validateSourceTargetState } from './profunctor-page-source-target-state.js';

export function validateStructuredSourceMapEntry(
  entry: JsonRecord,
  path: string,
): void {
  if (entry.sourceOccurrenceId === undefined) {
    if (entry.contentNodeId !== undefined) {
      failPageTarget(
        'BIJOU_PAGE_BLOCK_UNSUPPORTED',
        path,
        'semantic document source entries are outside the bounded ProjectPage target',
      );
    }
    invalid(`${path}.sourceOccurrenceId`, 'missing required field');
  }
  expectExactKeys(entry, path, [
    'templateNodeId',
    'pageNodeId',
    'sourceOccurrenceId',
    'source',
    'renderNodeId',
    'residual',
  ]);
  expectContractId(entry.templateNodeId, `${path}.templateNodeId`, 'template:');
  expectContractId(entry.pageNodeId, `${path}.pageNodeId`, 'page-node:');
  expectContractId(
    entry.sourceOccurrenceId,
    `${path}.sourceOccurrenceId`,
    'source-occurrence:',
  );
  validateStructuredSource(
    expectRecord(entry.source, `${path}.source`),
    `${path}.source`,
  );
  validateSourceTargetState(entry, path);
}

function validateStructuredSource(source: JsonRecord, path: string): void {
  expectExactKeys(
    source,
    path,
    [
      'path',
      'selector',
      'sourceDigest',
      'recordDigest',
      'parserProfile',
      'spanResidual',
    ],
    ['span'],
  );
  expectRepositoryPath(source.path, `${path}.path`);
  validateSelector(expectRecord(source.selector, `${path}.selector`), `${path}.selector`);
  expectDigest(source.sourceDigest, `${path}.sourceDigest`);
  expectDigest(source.recordDigest, `${path}.recordDigest`);
  if (source.parserProfile === null) {
    if (source.span !== undefined) {
      invalid(`${path}.span`, 'span requires a parser profile');
    }
    validateSpanResidual(
      expectRecord(source.spanResidual, `${path}.spanResidual`),
      `${path}.spanResidual`,
    );
    return;
  }
  expectNonWhitespaceString(source.parserProfile, `${path}.parserProfile`);
  if (source.spanResidual !== null) {
    invalid(`${path}.spanResidual`, 'profiled sources require a null span residual');
  }
  validateSpan(expectRecord(source.span, `${path}.span`), `${path}.span`);
}

function validateSelector(selector: JsonRecord, path: string): void {
  const kind = expectString(selector.kind, `${path}.kind`);
  const fields = kind === 'fact'
    ? ['kind', 'exportName', 'recordId', 'fieldPath']
    : ['kind', 'exportName', 'recordId'];
  expectExactKeys(selector, path, fields);
  if (kind !== 'record' && kind !== 'fact') {
    invalid(`${path}.kind`, 'expected record or fact');
  }
  expectNonWhitespaceString(selector.exportName, `${path}.exportName`);
  expectNonWhitespaceString(selector.recordId, `${path}.recordId`);
  if (kind === 'fact') {
    const fieldPath = expectStrings(selector.fieldPath, `${path}.fieldPath`);
    if (fieldPath.length === 0) {
      invalid(`${path}.fieldPath`, 'fact selectors require a field path');
    }
    for (const [index, field] of fieldPath.entries()) {
      if (
        /\s/u.test(field)
        || field === '__proto__'
        || field === 'constructor'
        || field === 'prototype'
      ) {
        invalid(`${path}.fieldPath[${String(index)}]`, 'unsafe selector field');
      }
    }
  }
}

function validateSpan(span: JsonRecord, path: string): void {
  expectExactKeys(span, path, ['start', 'end']);
  validatePosition(expectRecord(span.start, `${path}.start`), `${path}.start`);
  validatePosition(expectRecord(span.end, `${path}.end`), `${path}.end`);
}

function validatePosition(position: JsonRecord, path: string): void {
  expectExactKeys(position, path, ['offset', 'line', 'column']);
  expectIntegerAtLeast(position.offset, `${path}.offset`, 0);
  expectIntegerAtLeast(position.line, `${path}.line`, 1);
  expectIntegerAtLeast(position.column, `${path}.column`, 1);
}

function validateSpanResidual(residual: JsonRecord, path: string): void {
  expectExactKeys(residual, path, ['kind', 'reason']);
  if (residual.kind !== 'unavailable') {
    invalid(`${path}.kind`, 'expected unavailable');
  }
  expectKebabCase(residual.reason, `${path}.reason`);
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
