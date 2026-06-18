import { afterEach, describe, expect, it } from 'vitest';
import {
  stripAnsi,
  stringToSurface,
  surfaceToString,
  type OutputMode,
} from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import {
  createFramedApp,
  createNotificationState,
  dismissNotification,
  notify,
  pushNotification,
  renderNotificationHistory,
  renderNotificationStack,
  tickNotifications,
  type Cmd,
  type FramePage,
  type FramedAppMsg,
} from '../../../packages/bijou-tui/src/index.js';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { QUIT, isCmdCleanup } from '../../../packages/bijou-tui/src/types.js';
import { readRepoFile } from '../repo.js';

const NOTIFICATION_STORIES = [
  {
    id: 'notification-system',
    title: 'renderNotificationStack() / renderNotificationHistorySurface() / createFramedApp()',
    variants: ['live-stack', 'history-review', 'framed-routing'],
  },
  {
    id: 'transient-app-notifications',
    title: 'pushNotification() / renderNotificationStack()',
    variants: ['actionable-live', 'mixed-variants'],
  },
] as const;

const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

type SaveMsg = { readonly type: 'save' } | { readonly type: 'noop' };

interface SaveModel {
  readonly saved: boolean;
}

function getStory(storyId: string) {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === storyId);
  expect(story).toBeDefined();
  return story!;
}

function renderNotificationVariantText(
  storyId: string,
  variantId: string,
  mode: OutputMode,
): string {
  const story = getStory(storyId);
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 18,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

async function runFrameCommand<Msg>(
  cmd: Cmd<FramedAppMsg<Msg>>,
  now: number,
): Promise<unknown> {
  return cmd(() => undefined, {
    onPulse: () => ({ dispose() {} }),
    sleep: async () => undefined,
    now: () => now,
  });
}

function makeNotificationPage(): FramePage<SaveModel, SaveMsg> {
  return {
    id: 'home',
    title: 'Home',
    init: () => [{ saved: false }, []],
    update(msg, model) {
      if ('type' in msg && msg.type === 'save') {
        return [{
          ...model,
          saved: true,
        }, [notify<SaveMsg>({
          title: 'Saved draft',
          tone: 'SUCCESS',
          message: 'Frame-managed notification from the page update',
        })]];
      }

      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId: 'main',
      render: (width, height) => stringToSurface('home', width, height),
    }),
  };
}

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

  it('exercises notification lifecycle and renderers against real state', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 90, rows: 28 } });
    let state = createNotificationState<string>();

    state = pushNotification(state, {
      title: 'Canary ready',
      message: 'eu-west has stayed green for 15 minutes.',
      variant: 'ACTIONABLE',
      tone: 'SUCCESS',
      placement: 'UPPER_RIGHT',
      action: { label: 'Promote rollout', payload: 'promote' },
    }, 100);
    state = pushNotification(state, {
      title: 'Queue drift detected',
      message: 'Retry backlog is trending upward in the worker pool.',
      variant: 'TOAST',
      tone: 'WARNING',
      placement: 'LOWER_RIGHT',
    }, 120);
    state = tickNotifications(state, 500);

    const overlays = renderNotificationStack(state, {
      screenWidth: 90,
      screenHeight: 28,
      margin: 1,
      ctx,
    });
    const overlayText = overlays.map((overlay) => stripAnsi(overlay.content)).join('\n');

    expect(overlays).toHaveLength(2);
    expect(overlayText).toContain('Canary ready');
    expect(overlayText).toContain('Promote rollout');
    expect(overlayText).toContain('Queue drift detected');

    state = dismissNotification(state, 1, 900);
    state = dismissNotification(state, 2, 920);
    state = tickNotifications(state, 1_400);

    expect(state.items).toHaveLength(0);
    expect(state.history.map((item) => item.title)).toEqual(['Queue drift detected', 'Canary ready']);

    const history = stripAnsi(renderNotificationHistory(state, {
      width: 60,
      height: 10,
      filter: 'ALL',
      ctx,
    }));

    expect(history).toContain('History');
    expect(history).toContain('[SUCCESS] Canary ready');
    expect(history).toContain('Action: Promote rollout');
    expect(history).toContain('[WARNING] Queue drift detected');
  });

  it('routes runtime issues and page notify commands through framed notifications', async () => {
    const app = createFramedApp<SaveModel, SaveMsg>({
      pages: [makeNotificationPage()],
      initialColumns: 88,
      initialRows: 24,
      runtimeNotifications: {
        placement: 'TOP_CENTER',
        durationMs: 2_500,
      },
    });
    let [model] = app.init();

    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'warning',
      source: 'command',
      message: 'Command rejected: worker crashed during boot',
      atMs: 0,
    });

    expect(runtimeMsg).toBeDefined();
    let cmds: Cmd<FramedAppMsg<SaveMsg>>[] = [];
    [model, cmds] = app.update(runtimeMsg!, model);
    expect(model.runtimeNotifications.items).toHaveLength(1);
    expect(model.runtimeNotifications.items[0]!.message).toBe('Command rejected: worker crashed during boot');

    const runtimeTick = await runFrameCommand(cmds[0]!, 200);
    expect(runtimeTick).toBeDefined();
    expect(runtimeTick).not.toBe(QUIT);
    expect(isCmdCleanup(runtimeTick)).toBe(false);
    [model] = app.update(runtimeTick as FramedAppMsg<SaveMsg>, model);

    const runtimeFrame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    expect(stripAnsi(surfaceToString(runtimeFrame, createTestContext().style))).toContain(
      'Command rejected: worker crashed during boot',
    );

    [model, cmds] = app.update({ type: 'save' }, model);
    expect(model.pageModels.home?.saved).toBe(true);
    expect(cmds).toHaveLength(1);

    const notifyMsg = await runFrameCommand(cmds[0]!, 300);
    expect(notifyMsg).toBeDefined();
    expect(notifyMsg).not.toBe(QUIT);
    expect(isCmdCleanup(notifyMsg)).toBe(false);
    [model, cmds] = app.update(notifyMsg as FramedAppMsg<SaveMsg>, model);

    expect(model.runtimeNotifications.items.some((item) => item.title === 'Saved draft')).toBe(true);
    expect(model.runtimeNotifications.items.some((item) => item.message === 'Frame-managed notification from the page update')).toBe(true);

    if (cmds.length > 0) {
      const notifyTick = await runFrameCommand(cmds[0]!, 400);
      expect(notifyTick).toBeDefined();
      expect(notifyTick).not.toBe(QUIT);
      expect(isCmdCleanup(notifyTick)).toBe(false);
      [model] = app.update(notifyTick as FramedAppMsg<SaveMsg>, model);
    }

    const frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    const frameText = stripAnsi(surfaceToString(frame, createTestContext().style));

    expect(frameText).toContain('notices:2');
  });

  it('keeps component-family guidance aligned with notification runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Notification system');
    expect(families).toContain('- `renderNotificationStack()`');
    expect(families).toContain('- `renderNotificationHistory()`');
    expect(families).toContain('- `pushNotification()`');
    expect(families).toContain('- `dismissNotification()`');
    expect(families).toContain('- `tickNotifications()`');
    expect(families).toContain('- framed runtime notification routing');
    expect(families).toContain('- history/archive view');
    expect(families).toContain('- frame-routed runtime notifications');
    expect(families).toContain('stacking, placement, routing, or history matter');
    expect(families).toContain('pipe: lower to sequential event text or explicit warning/error records');
    expect(families).toContain('accessible: linearize current and archived notices');
  });
});
