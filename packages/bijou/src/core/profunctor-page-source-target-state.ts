import {
  expectContractId,
  expectExactKeys,
  expectKebabCase,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import { expectRecord, type JsonRecord } from './profunctor-page-json.js';

export function validateSourceTargetState(
  entry: JsonRecord,
  path: string,
): void {
  if (entry.renderNodeId !== null) {
    expectContractId(entry.renderNodeId, `${path}.renderNodeId`, 'render:');
  }
  if (entry.residual === null) {
    return;
  }
  const residual = expectRecord(entry.residual, `${path}.residual`);
  expectExactKeys(residual, `${path}.residual`, ['kind', 'reason']);
  if (residual.kind !== 'folded' && residual.kind !== 'omitted') {
    invalid(`${path}.residual.kind`, 'expected folded or omitted');
  }
  expectKebabCase(residual.reason, `${path}.residual.reason`);
  if (entry.renderNodeId !== null) {
    invalid(path, 'render node and residual are mutually exclusive');
  }
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
