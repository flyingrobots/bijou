import { type ReleaseReadinessTrackerItem } from './release-readiness-tracker.js';

export interface ReleaseReadinessStep {
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
}
export interface ReleaseReadinessDocsSnapshot {
  readonly roadmap: string;
  readonly bearing: string;
  readonly changelog: string;
  readonly releaseGuide: string;
  readonly releasePacketExists: boolean;
}
export type ReleaseReadinessCheckStatus = 'pass' | 'fail';
export interface ReleaseReadinessReportCheck {
  readonly label: string;
  readonly status: ReleaseReadinessCheckStatus;
  readonly summary: string;
}
export interface ReleaseReadinessReport {
  readonly milestone: string;
  readonly status: 'ready' | 'blocked';
  readonly checks: readonly ReleaseReadinessReportCheck[];
  readonly openTrackerItems: readonly ReleaseReadinessTrackerItem[];
  readonly wipTrackerItems: readonly ReleaseReadinessTrackerItem[];
}
export interface ReleaseReadinessIO {
  readonly cwd?: string;
  readonly milestone?: string;
  readonly trackerItems?: readonly ReleaseReadinessTrackerItem[];
  readonly docs?: ReleaseReadinessDocsSnapshot;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
  readonly runCommand?: (
    step: ReleaseReadinessStep,
    cwd: string,
  ) => {
    readonly status: number | null;
    readonly error?: Error;
  };
}
export function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}
export function buildReleaseReadinessPlan(): readonly ReleaseReadinessStep[] {
  const npm = npmCommand();
  return [
    { label: 'build', command: npm, args: ['run', 'build'] },
    { label: 'lint', command: npm, args: ['run', 'lint'] },
    { label: 'code:size', command: npm, args: ['run', 'code:size'] },
    { label: 'typecheck:test', command: npm, args: ['run', 'typecheck:test'] },
    {
      label: 'docs:design-system:preflight',
      command: npm,
      args: ['run', 'docs:design-system:preflight'],
    },
    {
      label: 'dogfood:coverage:gate',
      command: npm,
      args: ['run', 'dogfood:coverage:gate'],
    },
    {
      label: 'dogfood:i18n:check',
      command: npm,
      args: ['run', 'dogfood:i18n:check'],
    },
    {
      label: 'dogfood:i18n:debt',
      command: npm,
      args: ['run', 'dogfood:i18n:debt'],
    },
    {
      label: 'workflow:shell:preflight',
      command: npm,
      args: ['run', 'workflow:shell:preflight'],
    },
    {
      label: 'release:preflight',
      command: npm,
      args: ['run', 'release:preflight'],
    },
    { label: 'test:frames', command: npm, args: ['run', 'test:frames'] },
    {
      label: 'verify:interactive-examples',
      command: npm,
      args: ['run', 'verify:interactive-examples'],
    },
    {
      label: 'smoke:canaries',
      command: npm,
      args: ['run', 'smoke:canaries', '--', '--skip-build'],
    },
    {
      label: 'smoke:dogfood',
      command: npm,
      args: ['run', 'smoke:dogfood', '--', '--skip-build'],
    },
    { label: 'test', command: npm, args: ['test'] },
  ];
}
