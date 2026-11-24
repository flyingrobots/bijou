import { globToRegExp, shellCaseToRegExp } from './verification-lane-glob.js';
import { LANE_RULES, type Lane, type LaneRule, type ReasonId } from './verification-lane-rules.js';

/** A changed path and its `git diff --name-status` letter, or `null` when the caller listed bare paths. */
export interface ChangedPath {
  readonly path: string;
  readonly status: string | null;
}

/** Why a path went full regardless of the rule it matched. */
export type Escalation =
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'type-changed'
  | 'unmerged'
  | 'unrecognized-status'
  | 'invalid-path'
  | 'empty-change-set';

export interface PathReason {
  readonly path: string;
  readonly status: string | null;
  readonly lane: Lane;
  readonly reason: ReasonId;
  /** The rule pattern that decided the path, or `<no rule>`, `<invalid path>`, `<empty change set>`. */
  readonly pattern: string;
  readonly escalation: Escalation | null;
}

export interface LaneDecision {
  readonly lane: Lane;
  readonly dogfood: boolean;
  readonly reasons: readonly PathReason[];
}

export type VerificationPolicy = 'bijou.verify.fast.v1' | 'bijou.verify.full.v1';

/** The existing shell `case` patterns from `scripts/hooks/pre-push`, unchanged (DL-030). */
export const DOGFOOD_PATTERNS: readonly string[] = [
  '.github/workflows/*',
  'package.json',
  'package-lock.json',
  'packages/*',
  'examples/docs/*',
  'scripts/dogfood-*',
  'scripts/smoke-dogfood*',
  'tests/cycles/DF-*',
  'tests/cycles/*dogfood*',
  'docs/*',
];

const COMPILED = LANE_RULES.map((rule) => ({
  rule,
  match: globToRegExp(rule.pattern),
  except: rule.except == null ? null : globToRegExp(rule.except),
}));
const DOGFOOD = DOGFOOD_PATTERNS.map(shellCaseToRegExp);

/** Only an addition or an in-place modification may take a fast rule. */
const STATUS_ESCALATION: Readonly<Record<string, Escalation | null>> = {
  A: null,
  M: null,
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'type-changed',
  U: 'unmerged',
};

export function requiredPolicy(lane: Lane): VerificationPolicy {
  return lane === 'fast' ? 'bijou.verify.fast.v1' : 'bijou.verify.full.v1';
}

/** A repository-relative POSIX path with no empty, `.` or `..` segment. Anything else is full. */
export function isValidRepoPath(path: string): boolean {
  if (path === '' || path.startsWith('/') || /[\\\0\r\n]/.test(path)) return false;
  return path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

export function isDogfoodRelevant(path: string): boolean {
  return DOGFOOD.some((pattern) => pattern.test(path));
}

function matchRule(path: string): LaneRule | null {
  const found = COMPILED.find(({ match, except }) => match.test(path) && !(except?.test(path) ?? false));
  return found?.rule ?? null;
}

function statusEscalation(status: string | null): Escalation | null {
  if (status == null) return null;
  const escalation = STATUS_ESCALATION[status.charAt(0)];
  return escalation === undefined ? 'unrecognized-status' : escalation;
}

export function classifyPath(change: ChangedPath): PathReason {
  const { path, status } = change;
  if (!isValidRepoPath(path)) {
    return { path, status, lane: 'full', reason: 'unknown', pattern: '<invalid path>', escalation: 'invalid-path' };
  }
  const rule = matchRule(path);
  const escalation = statusEscalation(status);
  if (rule == null) return { path, status, lane: 'full', reason: 'unknown', pattern: '<no rule>', escalation };
  const lane = escalation == null ? rule.lane : 'full';
  return { path, status, lane, reason: rule.reason, pattern: rule.pattern, escalation };
}

/**
 * The heaviest path decides the lane. An empty change set is full, and an
 * invalid path or an empty set also sets `dogfood`, because neither proves
 * that DOGFOOD is unaffected.
 */
export function classifyChanges(changes: readonly ChangedPath[]): LaneDecision {
  if (changes.length === 0) {
    const reason: PathReason = {
      path: '',
      status: null,
      lane: 'full',
      reason: 'unknown',
      pattern: '<empty change set>',
      escalation: 'empty-change-set',
    };
    return { lane: 'full', dogfood: true, reasons: [reason] };
  }
  const reasons = changes.map(classifyPath);
  const lane: Lane = reasons.every((entry) => entry.lane === 'fast') ? 'fast' : 'full';
  const dogfood = reasons.some((entry) => entry.escalation === 'invalid-path' || isDogfoodRelevant(entry.path));
  return { lane, dogfood, reasons };
}

/** The DL-030 contract export: bare paths, classified by rule alone. */
export function classifyVerificationLane(paths: readonly string[]): LaneDecision {
  return classifyChanges(paths.map((path) => ({ path, status: null })));
}
