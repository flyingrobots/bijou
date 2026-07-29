import { spawnSync } from 'node:child_process';
import {
  formatTrackerItems,
  trackerItemLabelNames,
  type ReleaseReadinessTrackerItem,
} from './release-readiness-tracker.js';
import {
  type ReleaseReadinessDocsSnapshot,
  type ReleaseReadinessReport,
  type ReleaseReadinessReportCheck,
  type ReleaseReadinessStep,
  buildReleaseReadinessPlan,
} from './release-readiness.part01.js';
export function buildReleaseReadinessReport(options: {
  readonly milestone: string;
  readonly trackerItems: readonly ReleaseReadinessTrackerItem[];
  readonly docs: ReleaseReadinessDocsSnapshot;
  readonly plan?: readonly ReleaseReadinessStep[];
}): ReleaseReadinessReport {
  const milestone = options.milestone;
  const version = milestone.replace(/^v/, '');
  const plan = options.plan ?? buildReleaseReadinessPlan();
  const openTrackerItems = options.trackerItems.filter(
    (item) => !isClosedTrackerItem(item),
  );
  const wipTrackerItems = options.trackerItems.filter((item) =>
    trackerItemLabelNames(item).includes('work-in-progress'),
  );
  const hasChangelogBoundary =
    options.docs.changelog.includes(`## [${version}]`) ||
    options.docs.changelog.includes(`## [${milestone}]`) ||
    options.docs.changelog.includes('## [Unreleased]');
  const hasPackageSmoke = plan.some((step) => step.label === 'smoke:canaries');
  const hasReleaseDryRunBoundary =
    options.docs.releaseGuide.includes('release-dry-run') ||
    options.docs.releaseGuide.includes('Release Dry Run');
  const checks: ReleaseReadinessReportCheck[] = [
    {
      label: 'tracker-open-items',
      status: openTrackerItems.length === 0 ? 'pass' : 'fail',
      summary:
        openTrackerItems.length === 0
          ? `${milestone} has zero open tracker items`
          : `${milestone} has ${String(openTrackerItems.length)} open tracker item(s): ${formatTrackerItems(openTrackerItems)}`,
    },
    {
      label: 'tracker-wip-labels',
      status: wipTrackerItems.length === 0 ? 'pass' : 'fail',
      summary:
        wipTrackerItems.length === 0
          ? `${milestone} has no lingering work-in-progress labels`
          : `${milestone} has work-in-progress labels on ${formatTrackerItems(wipTrackerItems)}`,
    },
    {
      label: 'docs-roadmap-bearing',
      status:
        options.docs.roadmap.includes(milestone) &&
        options.docs.bearing.includes(milestone)
          ? 'pass'
          : 'fail',
      summary:
        options.docs.roadmap.includes(milestone) &&
        options.docs.bearing.includes(milestone)
          ? `ROADMAP.md and BEARING.md mention ${milestone}`
          : `ROADMAP.md and BEARING.md must both mention ${milestone}`,
    },
    {
      label: 'docs-changelog',
      status: hasChangelogBoundary ? 'pass' : 'fail',
      summary: hasChangelogBoundary
        ? `CHANGELOG.md has an Unreleased or ${milestone} release boundary`
        : `CHANGELOG.md must contain an Unreleased or ${milestone} release boundary`,
    },
    {
      label: 'release-packet',
      status: options.docs.releasePacketExists ? 'pass' : 'fail',
      summary: options.docs.releasePacketExists
        ? `docs/releases/${version}/README.md exists`
        : `docs/releases/${version}/README.md release evidence packet is missing`,
    },
    {
      label: 'package-smoke',
      status: hasPackageSmoke && hasReleaseDryRunBoundary ? 'pass' : 'fail',
      summary:
        hasPackageSmoke && hasReleaseDryRunBoundary
          ? 'release:readiness includes smoke:canaries and release.md documents the release dry-run package boundary'
          : 'release:readiness must include smoke:canaries and release.md must document the release dry-run package boundary',
    },
  ];

  return Object.freeze({
    milestone,
    status: checks.some((check) => check.status === 'fail')
      ? 'blocked'
      : 'ready',
    checks: Object.freeze(checks.map((check) => Object.freeze({ ...check }))),
    openTrackerItems: Object.freeze(
      openTrackerItems.map((item) => Object.freeze({ ...item })),
    ),
    wipTrackerItems: Object.freeze(
      wipTrackerItems.map((item) => Object.freeze({ ...item })),
    ),
  });
}
export function isClosedTrackerItem(
  item: ReleaseReadinessTrackerItem,
): boolean {
  const state = item.state.toUpperCase();
  return state === 'CLOSED' || state === 'MERGED';
}
export function formatReleaseReadinessReport(
  report: ReleaseReadinessReport,
): string {
  return [
    `Release readiness: ${report.status.toUpperCase()} (${report.milestone})`,
    '| Check | Status | Summary |',
    '| :--- | :--- | :--- |',
    ...report.checks.map(
      (check) =>
        `| ${check.label} | ${check.status.toUpperCase()} | ${escapeMarkdownTableCell(check.summary)} |`,
    ),
    '',
  ].join('\n');
}
export function defaultRunCommand(
  step: ReleaseReadinessStep,
  cwd: string,
): { readonly status: number | null; readonly error?: Error } {
  const result = spawnSync(step.command, step.args, {
    cwd,
    stdio: 'inherit',
  });
  return {
    status: result.status,
    error: result.error,
  };
}
function escapeMarkdownTableCell(text: string): string {
  return text.replaceAll('|', '\\|');
}
