import {
  expectDigest,
  expectExactKeys,
  expectNonWhitespaceString,
  expectRepositoryPath,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import { expectRecord } from './profunctor-page-json.js';
import type { ProfunctorPageNode } from './profunctor-page-model.js';

export interface PageSourceProvenance {
  readonly exportName: string;
  readonly recordId: string;
  readonly sourceDigest: string;
  readonly sourcePath: string;
}

export function readPageSourceProvenance(
  node: ProfunctorPageNode,
  required: boolean,
): PageSourceProvenance | null {
  const value = node.props.sourceProvenance;
  if (value == null) {
    if (required) {
      invalid(`${node.pageNodeId}.props.sourceProvenance`, 'missing required field');
    }
    return null;
  }
  const path = `${node.pageNodeId}.props.sourceProvenance`;
  const provenance = expectRecord(value, path);
  expectExactKeys(provenance, path, [
    'sourcePath',
    'sourceDigest',
    'exportName',
    'recordId',
  ]);
  return {
    exportName: expectNonWhitespaceString(
      provenance.exportName,
      `${path}.exportName`,
    ),
    recordId: expectNonWhitespaceString(provenance.recordId, `${path}.recordId`),
    sourceDigest: expectDigest(provenance.sourceDigest, `${path}.sourceDigest`),
    sourcePath: expectRepositoryPath(provenance.sourcePath, `${path}.sourcePath`),
  };
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
