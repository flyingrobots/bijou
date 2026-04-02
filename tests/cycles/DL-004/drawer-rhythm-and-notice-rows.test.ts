import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';
import {
  _resetDefaultContextForTesting,
  createTestContext,
} from '../../../packages/bijou/src/adapters/test/index.js';
import {
  setDefaultContext,
  stringToSurface,
  surfaceToString,
} from '../../../packages/bijou/src/index.js';
import {
  createNotificationState,
  dismissNotification,
  pushNotification,
  renderNotificationHistorySurface,
  tickNotifications,
  type NotificationState,
} from '../../../packages/bijou-tui/src/notification.js';
import {
  createFramedApp,
  type FramePage,
} from '../../../packages/bijou-tui/src/app-frame.js';


type Msg = { type: 'noop' };

interface PageModel {
  readonly count: number;
  readonly notifications: NotificationState<Msg>;
}

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

function seedNotificationHistory(
  specs: ReadonlyArray<{
    readonly title: string;
    readonly message?: string;
    readonly tone?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  }>,
): NotificationState<Msg> {
  let state = createNotificationState<Msg>();
  let nowMs = 0;

  for (const spec of specs) {
    state = pushNotification(state, {
      title: spec.title,
      message: spec.message ?? `${spec.title} message`,
      tone: spec.tone ?? 'INFO',
      durationMs: null,
    }, nowMs);
    const id = state.items.at(-1)!.id;
    nowMs += 20;
    state = dismissNotification(state, id, nowMs);
    nowMs += 500;
    state = tickNotifications(state, nowMs);
  }

  return state;
}

describe('DL-004 drawer rhythm and notice rows cycle', () => {
  const ctx = createTestContext({ mode: 'interactive' });

  beforeAll(() => setDefaultContext(ctx));
  afterAll(() => _resetDefaultContextForTesting());

  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-004-prove-drawer-rhythm-and-notice-rows.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('renders notification review rows with inset rhythm and secondary copy hierarchy', () => {
    const history = seedNotificationHistory([
      {
        title: 'Deploy blocked',
        message: 'The worker crashed before boot.',
        tone: 'ERROR',
      },
    ]);

    const surface = renderNotificationHistorySurface(history, {
      width: 34,
      height: 8,
      ctx,
    });
    const rendered = surfaceToString(surface, ctx.style).split('\n');
    const historyLine = rendered.findIndex((line) => line.includes('History'));
    const titleLine = rendered.findIndex((line) => line.includes('Deploy blocked'));
    const metaLine = rendered.findIndex((line) => line.includes('TOAST'));
    const messageLine = rendered.findIndex((line) => line.includes('worker crashed'));

    expect(historyLine).toBeGreaterThanOrEqual(0);
    expect(titleLine).toBeGreaterThan(historyLine + 1);
    expect(rendered[titleLine]!.indexOf('Deploy blocked')).toBeGreaterThan(0);
    expect(metaLine).toBe(titleLine + 1);
    expect(messageLine).toBeGreaterThan(metaLine);
  });

  it('renders the shell notification-center drawer with section spacing and structured live/archive rows', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory([
          { title: 'Archived info', tone: 'INFO' },
          { title: 'Archived warning', tone: 'WARNING' },
        ]),
      }, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<PageModel, Msg>({
      initialColumns: 90,
      initialRows: 18,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pushNotification(pageModel.notifications, {
          title: 'Deploy failed',
          message: 'The worker crashed before boot.',
          tone: 'ERROR',
          durationMs: null,
        }, 999),
      }),
    });

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'n', ctrl: false, alt: false, shift: true } as never, model);
    const view = app.view(model);
    if (typeof view === 'string' || !('cells' in view)) throw new Error('expected a surface');
    const lines = surfaceToString(view, ctx.style).split('\n');
    const liveLine = lines.findIndex((line) => line.includes('Live: 1 • Archived: 2'));
    const stackLine = lines.findIndex((line) => line.includes('Current stack'));
    const noticeLine = lines.findIndex((line) => line.includes('Deploy failed'));
    const historyLine = lines.findIndex((line) => line.includes('History • All'));

    expect(liveLine).toBeGreaterThanOrEqual(0);
    expect(stackLine).toBeGreaterThan(liveLine + 1);
    expect(noticeLine).toBeGreaterThan(stackLine + 1);
    expect(lines[noticeLine]!.indexOf('Deploy failed')).toBeGreaterThan(0);
    expect(historyLine).toBeGreaterThan(noticeLine + 2);
  });

  it('spawns the next design-language backlog item', () => {
    const cycle = readRepoFile('docs/design/DL-005-prove-inspector-and-guided-flow-rhythm.md');
    expect(cycle).toContain('# DL-005 — Prove Inspector and Guided Flow Rhythm');
  });
});
