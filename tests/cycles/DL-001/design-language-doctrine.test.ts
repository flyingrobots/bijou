import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('DL-001 design language doctrine cycle', () => {
  it('creates a Design Language legend and cycle doc with required workflow sections', () => {
    const legend = readRepoFile('docs/legends/DL-design-language.md');
    const cycle = readRepoFile('docs/design/DL-001-capture-design-language-doctrine.md');

    expect(legend).toContain('# DL — Design Language');
    expect(legend).toContain('[Bijou UX Doctrine]');
    expect(legend).toContain('[Accessibility and Assistive Modes]');
    expect(legend).toContain('[Localization and Bidirectionality]');
    expect(legend).toContain('[AI Explainability Standard]');
    expect(legend).toContain('[Content Guide]');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Retrospective');
  });

  it('captures mouse, cognitive load, AI, localization, and future blocks in doctrine', () => {
    const ux = readRepoFile('docs/strategy/bijou-ux-doctrine.md');
    const a11y = readRepoFile('docs/strategy/accessibility-and-assistive-modes.md');
    const lx = readRepoFile('docs/strategy/localization-and-bidirectionality.md');
    const ai = readRepoFile('docs/strategy/ai-explainability-standard.md');
    const content = readRepoFile('docs/strategy/content-guide.md');

    expect(ux).toContain('keyboard-first, mouse-enhanced');
    expect(ux).toContain('cognitive load');
    expect(ux).toContain('Blocks come after doctrine');

    expect(a11y).toContain('semantic shadow model');
    expect(a11y).toContain('high-contrast');
    expect(a11y).toContain('monochrome');

    expect(lx).toContain('catalog');
    expect(lx).toContain('spreadsheet');
    expect(lx).toContain('resource');
    expect(lx).toContain('data');
    expect(lx).toContain('marquee');
    expect(lx).toContain('start');
    expect(lx).toContain('end');

    expect(ai).toContain('[AI]');
    expect(ai).toContain('evidence');
    expect(ai).toContain('next action');

    expect(content).toContain('localizable');
    expect(content).toContain('accessible');
    expect(content).toContain('agent');
  });

  it('parks notification polish on the Humane Terminal backlog and spawns the next design-language backlog item', () => {
    const htBacklog = readRepoFile('docs/BACKLOG/HT-001-notification-center-polish-and-discoverability.md');
    const dlCycle = readRepoFile('docs/design/DL-002-canonicalize-patterns-and-blocks.md');

    expect(htBacklog).toContain('Notification Center Polish and Discoverability');
    expect(htBacklog).toContain('Parked on the backlog');
    expect(dlCycle).toContain('Canonicalize Patterns and Blocks');
  });
});
