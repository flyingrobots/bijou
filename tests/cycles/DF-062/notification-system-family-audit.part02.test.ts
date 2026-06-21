
import {
  _resetDefaultContextForTesting,
  afterEach,
  createFramedApp,
  createNotificationState,
  createTestContext,
  describe,
  dismissNotification,
  expect,
  it,
  makeNotificationPage,
  must,
  mustFrameMsg,
  normalizeViewOutput,
  pushNotification,
  renderNotificationHistory,
  renderNotificationStack,
  runFrameCommand,
  stripAnsi,
  surfaceToString,
  tickNotifications,
} from './notification-system-family-audit.test-support.js';

import type { SaveModel, SaveMsg } from './notification-system-family-audit.test-support.js';

describe('DF-062 notification system family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});

describe('DF-062 notification system family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
    const [afterRuntimeIssue, runtimeCmds] = app.update(must(runtimeMsg), model);
    model = afterRuntimeIssue;
    expect(model.runtimeNotifications.items).toHaveLength(1);
    expect(model.runtimeNotifications.items[0]?.message).toBe('Command rejected: worker crashed during boot');
    const runtimeTick = mustFrameMsg(await runFrameCommand(must(runtimeCmds[0]), 200));
    [model] = app.update(runtimeTick, model);
    const runtimeFrame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    expect(stripAnsi(surfaceToString(runtimeFrame, createTestContext().style))).toContain(
      'Command rejected: worker crashed during boot',
    );
    const [afterSave, saveCmds] = app.update({ type: 'save' }, model);
    model = afterSave;
    expect(model.pageModels.home?.saved).toBe(true);
    expect(saveCmds).toHaveLength(1);
    const notifyMsg = mustFrameMsg(await runFrameCommand(must(saveCmds[0]), 300));
    const [afterNotify, notifyCmds] = app.update(notifyMsg, model);
    model = afterNotify;
    expect(model.runtimeNotifications.items.some((item) => item.title === 'Saved draft')).toBe(true);
    expect(model.runtimeNotifications.items.some((item) => item.message === 'Frame-managed notification from the page update')).toBe(true);
    if (notifyCmds.length > 0) {
      const notifyTick = mustFrameMsg(await runFrameCommand(must(notifyCmds[0]), 400));
      [model] = app.update(notifyTick, model);
    }
    const frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    const frameText = stripAnsi(surfaceToString(frame, createTestContext().style));
    expect(frameText).toContain('notices:2');
  });
});
