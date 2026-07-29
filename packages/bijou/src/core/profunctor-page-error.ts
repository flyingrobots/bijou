export type ProfunctorPageTargetErrorCode =
  | 'BIJOU_PAGE_INPUT_JSON_INVALID'
  | 'BIJOU_PAGE_INPUT_VERSION_UNSUPPORTED'
  | 'BIJOU_PAGE_INPUT_DIGEST_MISMATCH'
  | 'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH'
  | 'BIJOU_PAGE_INPUT_REFERENCE_INVALID'
  | 'BIJOU_PAGE_BLOCK_UNSUPPORTED'
  | 'BIJOU_PAGE_OUTPUT_INVALID';

export class ProfunctorPageTargetError extends Error {
  readonly code: ProfunctorPageTargetErrorCode;
  readonly path: string;
  readonly detail: string;

  constructor(
    code: ProfunctorPageTargetErrorCode,
    path: string,
    detail: string,
    cause?: unknown,
  ) {
    super(`${code} at ${path}: ${detail}`, cause === undefined ? undefined : { cause });
    this.name = 'ProfunctorPageTargetError';
    this.code = code;
    this.path = path;
    this.detail = detail;
  }
}

export function failPageTarget(
  code: ProfunctorPageTargetErrorCode,
  path: string,
  detail: string,
  cause?: unknown,
): never {
  throw new ProfunctorPageTargetError(code, path, detail, cause);
}
