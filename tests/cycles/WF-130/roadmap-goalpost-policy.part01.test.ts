import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Expected JSON object');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

describe('WF-130 roadmap goalpost policy', () => {
  it('documents release packets, goalposts, stories, slices, gates, and proof', () => {
      expect(existsSync(resolve(ROOT, 'docs/method/releases/README.md'))).toBe(true);

      const releasePolicy = normalizeWhitespace(read('docs/method/releases/README.md'));

      expect(releasePolicy).toContain('Versioned Release');
      expect(releasePolicy).toContain('Goalpost');
      expect(releasePolicy).toContain('Umbrella Issue');
      expect(releasePolicy).toContain('User Story Issue');
      expect(releasePolicy).toContain('Slice Budget');
      expect(releasePolicy).toContain('Release Gate');
      expect(releasePolicy).toContain('Proof Policy');
      expect(releasePolicy).toContain('vMAJOR.MINOR.PATCH');
      expect(releasePolicy).toContain('`goalpost`');
      expect(releasePolicy).toContain('`user-story`');
      expect(releasePolicy).toContain('No implementation goalpost is complete through documentation alone.');
    });

  it('makes roadmap state GitHub-backed and groups current open tracker work', () => {
      const roadmap = normalizeWhitespace(read('docs/ROADMAP.md'));
      const bearing = normalizeWhitespace(read('docs/BEARING.md'));
      const releaseRunbook = normalizeWhitespace(read('docs/release.md'));
      const dx046Design = normalizeWhitespace(read('docs/design/DX-046-graphql-authored-dogfood-block-fixture.md'));

      expect(roadmap).toContain('Last synced from GitHub milestone items: 2026-06-16.');
      expect(roadmap).toContain('The latest shipped public release is');
      expect(roadmap).toContain('v7.1.0');
      expect(roadmap).toContain('v7.0.0');
      expect(roadmap).toContain('This roadmap is the forward-looking release horizon for Bijou.');
      expect(roadmap).toContain('`v7.1.0` is complete post-V7 minor release lineage');
      expect(roadmap).toContain('`v7.2.0` is now selected as a narrow stabilization and demo-integrity release.');
      expect(roadmap).toContain('Release Train Decision');
      expect(roadmap).toContain('`v7.1.0`: Shipped Post-V7 Minor');
      expect(roadmap).toContain('`v7.2.0`: Stabilization And Demo Integrity');
      expect(roadmap).toContain('`v8.0.0`: Runtime Graph And Scene IR Product Contract');
      expect(roadmap).toContain('`v9.0.0`: Product Workbench And Operator Surfaces');
      expect(roadmap).toContain('`v10.0.0+`: Ecosystem Integration');
      expect(roadmap).toContain('v6.0.0` was never published as a public package release');
      expect(roadmap).toContain('| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 4 | 10 |');
      expect(roadmap).toContain('| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 |');
      expect(roadmap).toContain('Latest shipped release lineage after the release PR merges.');
      expect(roadmap).toContain('#270 release-readiness guardrails, #312 DOGFOOD i18n debt coverage');
      expect(roadmap).toContain('`v6.0.0`');
      expect(roadmap).toContain('0 | 30');
      expect(roadmap).toContain('Skipped public release lane.');
      expect(roadmap).toContain('`v7.0.0`');
      expect(roadmap).toContain('0 | 27');
      expect(roadmap).toContain('Shipped release lineage.');
      expect(roadmap).toContain('`Beyond`');
      expect(roadmap).toContain('31 | 6');
      expect(roadmap).toContain('Next Pull');
      expect(roadmap).toContain('First-party theme variant coverage');
      expect(roadmap).toContain('DL-018');
      expect(roadmap).toContain('#343');
      expect(roadmap).toContain('paired or single-mode coverage');
      expect(roadmap).toContain('versioned artifact semantics');
      expect(roadmap).toContain('DOGFOOD fixtures that round-trip');
      expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/270');
      expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/312');
      expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/329');
      expect(roadmap).toContain('Forward Goalposts');
      expect(roadmap).toContain('Decision Points');
      expect(roadmap).toContain('Demo Integrity And Framework Input Stabilization');
      expect(roadmap).toContain('Runtime Graph And Scene IR Product Contract');
      expect(roadmap).toContain('Product Workbench And Operator Surfaces');
      expect(roadmap).toContain('Theme Lab and Theme Inspector provenance');
      expect(roadmap).toContain('localization workbench proof');
      expect(roadmap).toContain('terminal input controls');
      expect(roadmap).toContain('Open Unmilestoned Triage');
      expect(roadmap).toContain('[#352]');
      expect(roadmap).toContain('[#348]');
      expect(roadmap).toContain('[#321]');
      expect(roadmap).toContain('[#317]');
      expect(roadmap).toContain('[#316]');
      expect(roadmap).toContain('[#306]');
      expect(roadmap).toContain('[#249]');
      expect(roadmap).toContain('Dependency Security Lineage');
      expect(roadmap).toContain('[#357]');
      expect(roadmap).toContain('[#358]');
      expect(roadmap).toContain('[#326]');
      expect(roadmap).toContain('was not selected for `v7.1.0`');
      expect(roadmap).toContain('superseded by issue-backed');
      expect(roadmap).toContain('The `v7.1.0` GitHub milestone is closed release lineage.');
      expect(roadmap).toContain('Closed Lineage');
      expect(roadmap).toContain('Portable `ui-scene-ir/1` proof');
      expect(roadmap).toContain('Skipped public release; complete lineage');

      expect(roadmap).not.toContain('No next public release version is selected.');
      expect(roadmap).not.toContain('release-readiness validation before tagging');
      expect(roadmap).not.toContain('should not tag until release-readiness validation');
      expect(roadmap).not.toContain('Design Tokens And Theme Modes');
      expect(roadmap).not.toContain('Terminal Input And Host Controls');
      expect(roadmap).not.toContain('Workflow, Capture, And CI Determinism');
      expect(bearing).toContain('The latest shipped public release is `v7.1.0`');
      expect(bearing).toContain('The next feature horizon remains `v8.0.0`');
      expect(bearing).toContain('the immediate focus is');
      expect(bearing).toContain('`v7.2.0` is now selected as a narrow stabilization and demo-integrity release');
      expect(bearing).toContain('`v7.2.0` milestone is the current active stabilization lane: 4 open and 10 closed milestone items');
      expect(bearing).toContain('The next selected `v7.2.0` product pull after the Code Dojo gate is DX-047');
      expect(bearing).toContain('Stabilize V7.2, Then Shape V8 And V9 From Beyond');
      expect(bearing).not.toContain('The next release-facing action is release-readiness validation');

      expect(releaseRunbook).toContain('The latest shipped release is **`7.1.0`**.');
      expect(releaseRunbook).toContain('`7.2.0` is selected as a narrow stabilization and demo-integrity release');
      expect(releaseRunbook).toContain('New feature work should still shape toward `8.0.0`');
      expect(releaseRunbook).not.toContain('No next public release version is selected');

      expect(dx046Design).toContain('User story: [#329](https://github.com/flyingrobots/bijou/issues/329)');
      expect(dx046Design).toContain('Parent tracker: [#302](https://github.com/flyingrobots/bijou/issues/302)');
      expect(dx046Design).toContain('NavigationListBlock');
      expect(dx046Design).toContain('Tests To Write First');
    });

  it('disables Markdown line-length linting for project docs', () => {
      const markdownlintConfig = requireRecord(JSON.parse(read('.markdownlint.json')));

      expect(markdownlintConfig.MD013).toBe(false);
      expect(markdownlintConfig['line-length']).toBe(false);
    });
});
