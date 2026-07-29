import type { OutputMode } from './detect/tty.js';

export type ModeLoweringFactKind =
  'entity' | 'edge' | 'count' | 'label' | 'state' | 'custom';
export type ModeLoweringFactValue = string | number | boolean;
export interface ModeLoweringFact {
  readonly kind: ModeLoweringFactKind;
  readonly key: string;
  readonly value?: ModeLoweringFactValue;
  readonly label?: string;
  readonly required?: boolean;
}
export interface ModeLoweringModeFacts {
  readonly mode: OutputMode;
  readonly facts: readonly ModeLoweringFact[];
}
export type ModeLoweringSeverity = 'warning' | 'error';
export type ModeLoweringIssueKind =
  | 'missing-required-fact'
  | 'mismatched-fact-value'
  | 'duplicate-fact'
  | 'custom-assertion-failed';
export interface ModeLoweringIssue {
  readonly kind: ModeLoweringIssueKind;
  readonly severity: ModeLoweringSeverity;
  readonly mode?: OutputMode;
  readonly baselineMode?: OutputMode;
  readonly factKind?: ModeLoweringFactKind;
  readonly key?: string;
  readonly expected?: ModeLoweringFactValue;
  readonly actual?: ModeLoweringFactValue;
  readonly message: string;
}
export interface ModeLoweringAssertionResult {
  readonly passed: boolean;
  readonly message: string;
  readonly mode?: OutputMode;
  readonly key?: string;
  readonly severity?: ModeLoweringSeverity;
}
export interface ModeLoweringOptions {
  readonly baselineMode?: OutputMode;
  readonly modes: readonly ModeLoweringModeFacts[];
  readonly assertions?: readonly ModeLoweringAssertionResult[];
}
export interface ModeLoweringReport {
  readonly baselineMode: OutputMode;
  readonly checkedModes: readonly OutputMode[];
  readonly issues: readonly ModeLoweringIssue[];
  readonly passed: boolean;
}
export const DEFAULT_BASELINE_MODE: OutputMode = 'interactive';
export const MODE_ORDER: readonly OutputMode[] = [
  'interactive',
  'static',
  'pipe',
  'accessible',
];
export const FACT_SEPARATOR = ':';
export const LIST_SEPARATOR = ',';
export const EMPTY_LABEL = '-';
