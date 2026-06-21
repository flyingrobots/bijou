import { expect } from 'vitest';
import { stripAnsi, surfaceToString } from '@flyingrobots/bijou';
import type { OutputMode } from '@flyingrobots/bijou';
import { createTestContext, must } from '@flyingrobots/bijou/adapters/test';
import { createStoryProfileContext, storyPreviewSurface } from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { isFrameScopedMsg } from '../../../packages/bijou-tui/src/index.js';

import type { Cmd, FramedAppMsg } from '../../../packages/bijou-tui/src/index.js';
import { isCmdCleanup } from '../../../packages/bijou-tui/src/types.js';

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
  return must(story);
}

function renderNotificationVariantText(
  storyId: string,
  variantId: string,
  mode: OutputMode,
): string {
  const story = getStory(storyId);
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const selectedPreset = must(preset);
  const selectedVariant = must(variant);
  const previewCtx = createStoryProfileContext(baseCtx, selectedPreset, {
    width: selectedPreset.width,
    height: 18,
  });
  const preview = storyPreviewSurface(selectedVariant.render({
    width: selectedPreset.width,
    ctx: previewCtx,
    state: selectedVariant.initialState,
    timeMs: 0,
  }));
  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

async function runFrameCommand<Msg>(
  cmd: Cmd<FramedAppMsg<Msg>>,
  now: number,
): Promise<unknown> {
  return cmd(() => undefined, {
    onPulse: () => ({ dispose: () => undefined }),
    sleep: () => Promise.resolve(),
    now: () => now,
  });
}

function mustFrameMsg(value: unknown) {
  expect(isCmdCleanup(value)).toBe(false);
  expect(isFrameScopedMsg(value)).toBe(true);
  if (!isFrameScopedMsg(value)) throw new Error('expected frame message');
  return value;
}

export {
  BOX_DRAWING_RE,
  CONSTRAINED_MODES,
  getStory,
  mustFrameMsg,
  NOTIFICATION_STORIES,
  renderNotificationVariantText,
  runFrameCommand,
  VISUAL_MODES,
};

export type { SaveModel, SaveMsg };
