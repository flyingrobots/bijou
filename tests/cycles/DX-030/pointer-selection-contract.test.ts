import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

const DESIGN_DOC = 'docs/design/DX-030-add-boundary-aware-pointer-selection-and-copy.md';
const BACKLOG_DOC = 'docs/method/backlog/v6.0.0/DX-030-add-boundary-aware-pointer-selection-and-copy.md';

describe('DX-030 boundary-aware pointer selection and copy contract', () => {
  it('promotes the backlog item into a tested design-cycle contract', () => {
    expect(existsRepoPath(DESIGN_DOC)).toBe(true);
    expect(existsRepoPath(BACKLOG_DOC)).toBe(false);

    const cycle = readRepoFile(DESIGN_DOC);
    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Contract');
    expect(cycle).toContain('## Runtime Flow');
    expect(cycle).toContain('## Arbitration');
    expect(cycle).toContain('## Extraction Rules');
    expect(cycle).toContain('## Non-Goals');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('defines the selection contract records future runtime work must target', () => {
    const cycle = readRepoFile(DESIGN_DOC);

    expect(cycle).toContain('SelectionOwner');
    expect(cycle).toContain('SelectionRegion');
    expect(cycle).toContain('SelectionRange');
    expect(cycle).toContain('SelectionContentModel');
    expect(cycle).toContain('SelectionExtractor');
    expect(cycle).toContain('SelectionCoordinator');
    expect(cycle).toContain('stable owner id');
    expect(cycle).toContain('assigned screen rect');
    expect(cycle).toContain('viewport transform');
  });

  it('keeps geometry authority in retained layout instead of rendered strings', () => {
    const cycle = readRepoFile(DESIGN_DOC);

    expect(cycle).toContain('Hit-testing must start from retained layout geometry, not rendered strings.');
    expect(cycle).toContain('hit-test the topmost retained layout region');
    expect(cycle).toContain('clamp movement to the owner region');
    expect(cycle).toContain('Selection is a pointer interaction that uses layout truth.');
    expect(cycle).toContain('not a terminal-row scrape');
  });

  it('requires semantic extraction for copy output', () => {
    const cycle = readRepoFile(DESIGN_DOC);

    expect(cycle).toContain('Extraction reconstructs output from semantic content metadata');
    expect(cycle).toContain('prose unwraps soft wraps');
    expect(cycle).toContain('tables preserve cell boundaries');
    expect(cycle).toContain('mixed panes concatenate child extractions in semantic order');
    expect(cycle).toContain('decorative chrome, gutters, scrollbars, and focus rails are excluded');
    expect(cycle).toContain('Copying to an OS clipboard is a host effect.');
  });

  it('defines mouse arbitration and terminal fallback boundaries', () => {
    const cycle = readRepoFile(DESIGN_DOC);

    expect(cycle).toContain('Active modal or overlay captures first.');
    expect(cycle).toContain('Explicit drag handles and resize controls win over selection.');
    expect(cycle).toContain('Component-owned pointer handlers win');
    expect(cycle).toContain('Terminal-native selection remains a host fallback');
    expect(cycle).toContain('selection should never steal a gesture');
  });

  it('updates v6 lane and DX legend pointers', () => {
    const lane = readRepoFile('docs/method/backlog/v6.0.0/README.md');
    const legend = readRepoFile('docs/legends/DX-developer-experience.md');

    expect(lane).toContain('[**DX-030**](../../../design/DX-030-add-boundary-aware-pointer-selection-and-copy.md)');
    expect(legend).toContain('[DX-030 — Add Boundary-Aware Pointer Selection And Copy](../design/DX-030-add-boundary-aware-pointer-selection-and-copy.md)');
  });
});
