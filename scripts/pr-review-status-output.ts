import type {
  CheckEntry,
  ReviewStatusReport,
} from './pr-review-status-contract.js';
import { mergeReadinessHeading } from './pr-review-status-readiness.js';

function writeChecks(title: string, checks: readonly CheckEntry[]): void {
  if (checks.length === 0) return;
  process.stdout.write(`\n${title}:\n`);
  for (const check of checks) {
    const link = check.link == null ? '' : ` ${check.link}`;
    process.stdout.write(`- ${check.name} (${check.state})${link}\n`);
  }
}

export function writeReviewStatus(report: ReviewStatusReport): void {
  const { pr, checks, unresolved, reviews, codeRabbit, readiness, options } =
    report;
  process.stdout.write(`PR #${String(pr.number)}: ${pr.title}\n`);
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
    `Checks: pass=${String(checks.counts.pass ?? 0)} pending=${String(checks.counts.pending ?? 0)} fail=${String(checks.counts.fail ?? 0)} skipping=${String(checks.counts.skipping ?? 0)} cancel=${String(checks.counts.cancel ?? 0)}\n`,
  );
  process.stdout.write(`Unresolved threads: ${String(unresolved.length)}\n`);
  process.stdout.write(
    `Reviews: total=${String(reviews.total)} approvals=${String(reviews.approvals)} changes_requested=${String(reviews.changesRequested)} comments=${String(reviews.comments)}\n`,
  );
  process.stdout.write(`CodeRabbit: ${codeRabbit.detail}\n`);
  if (options.mergeReady) {
    process.stdout.write(
      `Merge readiness: ${readiness.status.toUpperCase()}\n`,
    );
    process.stdout.write(
      `Review gate: ${String(reviews.total)}/${String(options.minReviews)}\n`,
    );
  }

  writeChecks('Failing checks', checks.failing);
  writeChecks('Canceled checks', checks.canceled);
  writeChecks('Pending checks', checks.pending);
  if (unresolved.length > 0) {
    process.stdout.write('\nUnresolved review threads:\n');
    for (const finding of unresolved) {
      process.stdout.write(
        `- [${finding.author}] ${finding.path}: ${finding.summary}\n  ${finding.url}\n`,
      );
    }
  }
  if (options.mergeReady && readiness.reasons.length > 0) {
    process.stdout.write(`\n${mergeReadinessHeading(readiness)}:\n`);
    for (const reason of readiness.reasons) {
      process.stdout.write(`- ${reason}\n`);
    }
  }
}
