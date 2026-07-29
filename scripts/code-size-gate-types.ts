export interface CodeSizeBaselineEntry {
  readonly path: string;
  readonly lines: number;
}

export interface CodeSizeFile {
  readonly path: string;
  readonly lines: number;
}

export interface CodeSizeGateResult {
  readonly ok: boolean;
  readonly files: readonly CodeSizeFile[];
  readonly violations: readonly string[];
}

export interface CodeSizeGateOptions {
  readonly cwd?: string;
  readonly files?: readonly CodeSizeFile[];
  readonly baseline?: readonly CodeSizeBaselineEntry[];
}
