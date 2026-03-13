#!/usr/bin/env npx tsx

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PullRequestView {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly baseRefName: string;
  readonly headRefName: string;
  readonly isDraft: boolean;
  readonly url: string;
  readonly reviewDecision?: string | null;
  readonly mergeStateStatus?: string | null;
  readonly comments: readonly PullRequestComment[];
  readonly reviews: readonly PullRequestReview[];
}

interface CheckEntry {
  readonly name: string;
  readonly bucket: 'pass' | 'fail' | 'pending' | 'skipping' | 'cancel' | string;
  readonly state: string;
  readonly link?: string;
  readonly workflow?: string;
}

interface PullRequestComment {
  readonly author?: { readonly login: string } | null;
  readonly body: string;
  readonly createdAt: string;
}

interface PullRequestReview {
  readonly author?: { readonly login: string } | null;
  readonly body: string;
  readonly submittedAt: string;
  readonly state: string;
}

interface ReviewThreadComment {
  readonly author?: { readonly login: string } | null;
  readonly body: string;
  readonly path?: string | null;
  readonly url: string;
}

interface ReviewThreadNode {
  readonly isResolved: boolean;
  readonly comments: { readonly nodes: readonly ReviewThreadComment[] };
}

interface ReviewThreadsResponse {
  readonly data: {
    readonly repository: {
      readonly pullRequest: {
        readonly reviewThreads: {
          readonly nodes: readonly ReviewThreadNode[];
        };
      };
    };
  };
}

export interface CheckSummary {
  readonly counts: Readonly<Record<string, number>>;
  readonly failing: readonly CheckEntry[];
  readonly pending: readonly CheckEntry[];
  readonly canceled: readonly CheckEntry[];
  readonly codeRabbit: CheckEntry | null;
}

export interface UnresolvedFinding {
  readonly author: string;
  readonly path: string;
  readonly url: string;
  readonly summary: string;
}

export interface ReviewSummary {
  readonly total: number;
  readonly approvals: number;
  readonly changesRequested: number;
  readonly comments: number;
  readonly byState: Readonly<Record<string, number>>;
}

type CodeRabbitEventKind = 'rate_limit' | 'clean' | 'actionable' | 'other';

export interface CodeRabbitStatus {
  readonly state: 'missing' | 'pass' | 'pending' | 'failing' | 'rate_limited' | 'actionable' | 'clean' | 'commented';
  readonly detail: string;
  readonly latestKind: CodeRabbitEventKind | 'none';
  readonly staleRateLimitCount: number;
  readonly activeRateLimitCount: number;
}

export interface MergeReadiness {
  readonly status: 'ready' | 'pending' | 'blocked';
  readonly reasons: readonly string[];
}

export function summarizeChecks(checks: readonly CheckEntry[]): CheckSummary {
  const counts: Record<string, number> = {
    pass: 0,
    fail: 0,
    pending: 0,
    skipping: 0,
    cancel: 0,
    other: 0,
  };

  for (const check of checks) {
    if (check.bucket in counts) {
      counts[check.bucket] += 1;
    } else {
      counts.other += 1;
    }
  }

  return {
    counts,
    failing: checks.filter((check) => check.bucket === 'fail'),
    pending: checks.filter((check) => check.bucket === 'pending'),
    canceled: checks.filter((check) => check.bucket === 'cancel'),
    codeRabbit: checks.find((check) => check.name === 'CodeRabbit') ?? null,
  };
}

export function extractUnresolvedFindings(threads: readonly ReviewThreadNode[]): readonly UnresolvedFinding[] {
  return threads
    .filter((thread) => !thread.isResolved)
    .map((thread) => thread.comments.nodes[0])
    .filter((comment): comment is ReviewThreadComment => comment != null)
    .map((comment) => ({
      author: comment.author?.login ?? '(unknown)',
      path: comment.path ?? '(no file)',
      url: comment.url,
      summary: summarizeComment(comment.body),
    }));
}

export function summarizeReviews(reviews: readonly PullRequestReview[]): ReviewSummary {
  const byState: Record<string, number> = {};

  for (const review of reviews) {
    byState[review.state] = (byState[review.state] ?? 0) + 1;
  }

  return {
    total: reviews.length,
    approvals: byState.APPROVED ?? 0,
    changesRequested: byState.CHANGES_REQUESTED ?? 0,
    comments: byState.COMMENTED ?? 0,
    byState,
  };
}

export function summarizeCodeRabbitStatus(
  codeRabbitCheck: CheckEntry | null,
  comments: readonly PullRequestComment[],
  reviews: readonly PullRequestReview[],
): CodeRabbitStatus {
  const events = collectCodeRabbitEvents(comments, reviews);
  const latestEvent = events[0] ?? null;
  const latestNonRateLimitAt = events.find((event) => event.kind !== 'rate_limit')?.at ?? null;
  const hasPassingCheck = codeRabbitCheck?.bucket === 'pass';

  const staleRateLimitCount = events.filter((event) => {
    if (event.kind !== 'rate_limit') {
      return false;
    }

    if (hasPassingCheck) {
      return true;
    }

    return latestNonRateLimitAt != null && event.at < latestNonRateLimitAt;
  }).length;

  const activeRateLimitCount = events.filter((event) => event.kind === 'rate_limit').length - staleRateLimitCount;

  if (codeRabbitCheck?.bucket === 'pass') {
    return {
      state: 'pass',
      detail: staleRateLimitCount > 0
        ? `pass (${staleRateLimitCount} stale rate-limit comment${staleRateLimitCount === 1 ? '' : 's'} ignored)`
        : 'pass',
      latestKind: latestEvent?.kind ?? 'none',
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (codeRabbitCheck?.bucket === 'pending') {
    return {
      state: activeRateLimitCount > 0 ? 'rate_limited' : 'pending',
      detail: activeRateLimitCount > 0 ? 'rate-limited' : 'pending',
      latestKind: latestEvent?.kind ?? 'none',
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (codeRabbitCheck?.bucket === 'fail' || codeRabbitCheck?.bucket === 'cancel') {
    return {
      state: 'failing',
      detail: codeRabbitCheck.bucket === 'cancel' ? 'canceled' : 'failing',
      latestKind: latestEvent?.kind ?? 'none',
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (activeRateLimitCount > 0) {
    return {
      state: 'rate_limited',
      detail: 'rate-limited',
      latestKind: latestEvent?.kind ?? 'none',
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (latestEvent?.kind === 'clean') {
    return {
      state: 'clean',
      detail: staleRateLimitCount > 0
        ? `no actionable comments (${staleRateLimitCount} stale rate-limit comment${staleRateLimitCount === 1 ? '' : 's'} ignored)`
        : 'no actionable comments',
      latestKind: latestEvent.kind,
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (latestEvent?.kind === 'actionable') {
    return {
      state: 'actionable',
      detail: staleRateLimitCount > 0
        ? `actionable comments (${staleRateLimitCount} stale rate-limit comment${staleRateLimitCount === 1 ? '' : 's'} ignored)`
        : 'actionable comments',
      latestKind: latestEvent.kind,
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  if (latestEvent != null) {
    return {
      state: 'commented',
      detail: staleRateLimitCount > 0
        ? `commented (${staleRateLimitCount} stale rate-limit comment${staleRateLimitCount === 1 ? '' : 's'} ignored)`
        : 'commented',
      latestKind: latestEvent.kind,
      staleRateLimitCount,
      activeRateLimitCount,
    };
  }

  return {
    state: 'missing',
    detail: 'missing',
    latestKind: 'none',
    staleRateLimitCount,
    activeRateLimitCount,
  };
}

export function computeMergeReadiness(input: {
  readonly pr: Pick<PullRequestView, 'state' | 'isDraft'>;
  readonly checks: CheckSummary;
  readonly unresolvedCount: number;
  readonly reviews: ReviewSummary;
  readonly codeRabbit: CodeRabbitStatus;
  readonly minReviews: number;
}): MergeReadiness {
  const reasons: string[] = [];

  if (input.pr.state !== 'OPEN') {
    reasons.push(`pull request is ${input.pr.state.toLowerCase()}`);
  }

  if (input.pr.isDraft) {
    reasons.push('pull request is still a draft');
  }

  if (input.checks.failing.length > 0) {
    reasons.push(`${input.checks.failing.length} failing check${input.checks.failing.length === 1 ? '' : 's'}`);
  }

  if (input.checks.canceled.length > 0) {
    reasons.push(`${input.checks.canceled.length} canceled check${input.checks.canceled.length === 1 ? '' : 's'}`);
  }

  if (input.unresolvedCount > 0) {
    reasons.push(`${input.unresolvedCount} unresolved review thread${input.unresolvedCount === 1 ? '' : 's'}`);
  }

  if (input.reviews.changesRequested > 0) {
    reasons.push(`${input.reviews.changesRequested} change-request review${input.reviews.changesRequested === 1 ? '' : 's'}`);
  }

  if (input.reviews.total < input.minReviews) {
    reasons.push(`needs at least ${input.minReviews} review${input.minReviews === 1 ? '' : 's'} (found ${input.reviews.total})`);
  }

  if (reasons.length > 0) {
    return { status: 'blocked', reasons };
  }

  const pendingReasons: string[] = [];

  if (input.checks.pending.length > 0) {
    pendingReasons.push(`${input.checks.pending.length} pending check${input.checks.pending.length === 1 ? '' : 's'}`);
  }

  if (input.codeRabbit.state === 'pending') {
    pendingReasons.push('CodeRabbit review still pending');
  } else if (input.codeRabbit.state === 'rate_limited') {
    pendingReasons.push('CodeRabbit is rate-limited');
  }

  if (pendingReasons.length > 0) {
    return { status: 'pending', reasons: pendingReasons };
  }

  return { status: 'ready', reasons: [] };
}

export function computeExitCode(summary: CheckSummary, unresolvedCount: number): number {
  if (summary.failing.length > 0 || summary.canceled.length > 0 || unresolvedCount > 0) {
    return 1;
  }

  if (summary.pending.length > 0) {
    return 8;
  }

  return 0;
}

export function computeMergeReadinessExitCode(readiness: MergeReadiness): number {
  switch (readiness.status) {
    case 'ready':
      return 0;
    case 'pending':
      return 8;
    case 'blocked':
      return 1;
  }
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const pr = ghJson<PullRequestView>([
    'pr',
    'view',
    ...maybeArg(options.prArg),
    '--json',
    'number,title,state,baseRefName,headRefName,isDraft,url,reviewDecision,mergeStateStatus,comments,reviews',
  ]);
  const checks = ghJson<CheckEntry[]>([
    'pr',
    'checks',
    String(pr.number),
    '--json',
    'name,bucket,state,link,workflow',
  ]);
  const threads = fetchReviewThreads(pr.number);
  const unresolved = extractUnresolvedFindings(threads);
  const summary = summarizeChecks(checks);
  const reviewSummary = summarizeReviews(pr.reviews);
  const codeRabbitStatus = summarizeCodeRabbitStatus(summary.codeRabbit, pr.comments, pr.reviews);
  const mergeReadiness = computeMergeReadiness({
    pr,
    checks: summary,
    unresolvedCount: unresolved.length,
    reviews: reviewSummary,
    codeRabbit: codeRabbitStatus,
    minReviews: options.minReviews,
  });

  process.stdout.write(`PR #${pr.number}: ${pr.title}\n`);
  process.stdout.write(`State: ${pr.state}${pr.isDraft ? ' (draft)' : ''}\n`);
  process.stdout.write(`Branch: ${pr.headRefName} -> ${pr.baseRefName}\n`);
  if (pr.reviewDecision) {
    process.stdout.write(`Review decision: ${pr.reviewDecision}\n`);
  }
  if (pr.mergeStateStatus) {
    process.stdout.write(`Merge state: ${pr.mergeStateStatus}\n`);
  }
  process.stdout.write(`URL: ${pr.url}\n\n`);

  process.stdout.write(
    `Checks: pass=${summary.counts.pass} pending=${summary.counts.pending} fail=${summary.counts.fail} skipping=${summary.counts.skipping} cancel=${summary.counts.cancel}\n`,
  );
  process.stdout.write(`Unresolved threads: ${unresolved.length}\n`);
  process.stdout.write(
    `Reviews: total=${reviewSummary.total} approvals=${reviewSummary.approvals} changes_requested=${reviewSummary.changesRequested} comments=${reviewSummary.comments}\n`,
  );
  process.stdout.write(`CodeRabbit: ${codeRabbitStatus.detail}\n`);

  if (options.mergeReady) {
    process.stdout.write(`Merge readiness: ${mergeReadiness.status.toUpperCase()}\n`);
    process.stdout.write(`Review gate: ${reviewSummary.total}/${options.minReviews}\n`);
  }

  if (summary.failing.length > 0) {
    process.stdout.write('\nFailing checks:\n');
    for (const check of summary.failing) {
      process.stdout.write(`- ${check.name} (${check.state})${check.link ? ` ${check.link}` : ''}\n`);
    }
  }

  if (summary.canceled.length > 0) {
    process.stdout.write('\nCanceled checks:\n');
    for (const check of summary.canceled) {
      process.stdout.write(`- ${check.name} (${check.state})${check.link ? ` ${check.link}` : ''}\n`);
    }
  }

  if (summary.pending.length > 0) {
    process.stdout.write('\nPending checks:\n');
    for (const check of summary.pending) {
      process.stdout.write(`- ${check.name} (${check.state})${check.link ? ` ${check.link}` : ''}\n`);
    }
  }

  if (unresolved.length > 0) {
    process.stdout.write('\nUnresolved review threads:\n');
    for (const finding of unresolved) {
      process.stdout.write(`- [${finding.author}] ${finding.path}: ${finding.summary}\n  ${finding.url}\n`);
    }
  }

  if (options.mergeReady && mergeReadiness.reasons.length > 0) {
    process.stdout.write(`\nMerge blockers:\n`);
    for (const reason of mergeReadiness.reasons) {
      process.stdout.write(`- ${reason}\n`);
    }
  }

  process.exitCode = options.mergeReady
    ? computeMergeReadinessExitCode(mergeReadiness)
    : computeExitCode(summary, unresolved.length);
}

function fetchReviewThreads(prNumber: number): readonly ReviewThreadNode[] {
  const query = `
query($prNumber: Int!) {
  repository(owner: "flyingrobots", name: "bijou") {
    pullRequest(number: $prNumber) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          comments(first: 20) {
            nodes {
              author { login }
              body
              path
              url
            }
          }
        }
      }
    }
  }
}
`;

  const payload = ghGraphql<ReviewThreadsResponse>(query, { prNumber: String(prNumber) });
  return payload.data.repository.pullRequest.reviewThreads.nodes;
}

function summarizeComment(body: string): string {
  const firstLine = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('<!--') && !line.startsWith('<details>') && !line.startsWith('</details>'));

  return firstLine == null ? '(no summary)' : firstLine.slice(0, 140);
}

function collectCodeRabbitEvents(
  comments: readonly PullRequestComment[],
  reviews: readonly PullRequestReview[],
): readonly { readonly at: string; readonly kind: CodeRabbitEventKind }[] {
  const commentEvents = comments
    .filter((comment) => comment.author?.login === 'coderabbitai')
    .map((comment) => ({
      at: comment.createdAt,
      kind: classifyCodeRabbitBody(comment.body),
    }));
  const reviewEvents = reviews
    .filter((review) => review.author?.login === 'coderabbitai')
    .map((review) => ({
      at: review.submittedAt,
      kind: classifyCodeRabbitBody(review.body),
    }));

  return [...commentEvents, ...reviewEvents].sort((left, right) => right.at.localeCompare(left.at));
}

function classifyCodeRabbitBody(body: string): CodeRabbitEventKind {
  const normalized = body.toLowerCase();

  if (normalized.includes('rate limit exceeded')) {
    return 'rate_limit';
  }

  if (normalized.includes('no actionable comments were generated in the recent review')) {
    return 'clean';
  }

  if (/\*\*actionable comments posted:\s*[1-9]/i.test(body)) {
    return 'actionable';
  }

  if (/\*\*actionable comments posted:\s*0/i.test(body)) {
    return 'clean';
  }

  return 'other';
}

function ghJson<T>(args: readonly string[]): T {
  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
  });

  return JSON.parse(output) as T;
}

function ghGraphql<T>(query: string, variables: Readonly<Record<string, string>>): T {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    args.push('-F', `${key}=${value}`);
  }

  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
  });

  return JSON.parse(output) as T;
}

function maybeArg(value: string | undefined): readonly string[] {
  return value == null || value === '' ? [] : [value];
}

function parseArgs(args: readonly string[]): { readonly mergeReady: boolean; readonly minReviews: number; readonly prArg?: string } {
  let mergeReady = false;
  let minReviews = 2;
  let prArg: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--merge-ready') {
      mergeReady = true;
      continue;
    }

    if (arg === '--min-reviews') {
      const value = args[index + 1];
      if (value == null || !/^\d+$/.test(value)) {
        throw new Error('--min-reviews requires a numeric value');
      }

      minReviews = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (prArg == null) {
      prArg = arg;
      continue;
    }

    throw new Error(`unexpected argument: ${arg}`);
  }

  return { mergeReady, minReviews, prArg };
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
