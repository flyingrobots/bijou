import {
  _resetDefaultContextForTesting,
  afterEach,
  BOX_DRAWING_RE,
  CONSTRAINED_MODES,
  describe,
  expect,
  getStory,
  it,
  NOTIFICATION_STORIES,
  readRepoFile,
  renderNotificationVariantText,
  VISUAL_MODES,
} from './notification-system-family-audit.test-support.js';

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-062-audit-notification-system-family-across-real-surfaces.md');
    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('represents notification system stories in the DOGFOOD story catalog', () => {
    for (const expected of NOTIFICATION_STORIES) {
      const story = getStory(expected.id);
      expect(story.coverageFamilyIds).toContain(expected.id);
      expect(story.title).toBe(expected.title);
      expect(story.package).toBe('bijou-tui');
      expect(story.variants.map((variant) => variant.id)).toEqual(expected.variants);
      expect(story.docs.gracefulLowering.pipe).not.toMatch(/future direction|no mode-aware lowering yet/i);
      expect(story.docs.gracefulLowering.accessible).not.toMatch(/future direction|no mode-aware lowering yet/i);
    }
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('renders every notification variant in every documented profile', () => {
    for (const story of NOTIFICATION_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
          const text = renderNotificationVariantText(story.id, variantId, mode);
          expect(text.trim().length, `${story.id}/${variantId}/${mode}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps visual notification chrome out of constrained lowerings', () => {
    for (const story of NOTIFICATION_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of VISUAL_MODES) {
          const text = renderNotificationVariantText(story.id, variantId, mode);
          expect(text, `${story.id}/${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
        }
        for (const mode of CONSTRAINED_MODES) {
          const text = renderNotificationVariantText(story.id, variantId, mode);
          expect(text, `${story.id}/${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
        }
      }
    }
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('preserves live-stack and history semantics in constrained lowerings', () => {
    const stackPipe = renderNotificationVariantText('notification-system', 'live-stack', 'pipe');
    const historyAccessible = renderNotificationVariantText('notification-system', 'history-review', 'accessible');
    expect(stackPipe).toContain('notification stack');
    expect(stackPipe).toContain('[SUCCESS] Canary ready');
    expect(stackPipe).toContain('Action: Promote rollout');
    expect(stackPipe).toContain('[WARNING] Queue drift detected');
    expect(historyAccessible).toContain('notification history');
    expect(historyAccessible).toContain('History');
    expect(historyAccessible).toContain('[ERROR] Deploy blocked');
    expect(historyAccessible).toContain('Action: Retry deploy');
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('preserves framed routing facts in constrained lowerings', () => {
    const pipe = renderNotificationVariantText('notification-system', 'framed-routing', 'pipe');
    const accessible = renderNotificationVariantText('notification-system', 'framed-routing', 'accessible');
    for (const text of [pipe, accessible]) {
      expect(text).toContain('framed notifications');
      expect(text).toContain('frame runtime notifications');
      expect(text).toContain('[WARNING] Runtime issue routed');
      expect(text).toContain('Command rejected: worker crashed during boot');
      expect(text).toContain('[SUCCESS] Saved draft');
      expect(text).toContain('Frame-managed notification from the page update');
      expect(text).toContain('Footer cue: notices:2');
    }
  });
});

describe('DF-062 notification system family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('preserves app-owned transient notices in constrained lowerings', () => {
    const actionablePipe = renderNotificationVariantText('transient-app-notifications', 'actionable-live', 'pipe');
    const mixedAccessible = renderNotificationVariantText('transient-app-notifications', 'mixed-variants', 'accessible');
    expect(actionablePipe).toContain('transient notifications');
    expect(actionablePipe).toContain('[SUCCESS] Deploy approval ready');
    expect(actionablePipe).toContain('Action: Promote rollout');
    expect(actionablePipe).toContain('[WARNING] Queue drift detected');
    expect(mixedAccessible).toContain('mixed live notices');
    expect(mixedAccessible).toContain('[INFO] Release notes synced');
  });
});
