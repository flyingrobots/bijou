import {
  boxSurface,
  kbd,
  separatorSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  createPagerStateForSurface,
  pagerSurface,
  viewportSurface,
} from '../../packages/bijou-tui/src/index.js';
import {
  badgeSurface,
  column,
  line,
  row,
  screenSurface,
  spacer,
  textSurface,
} from '../_shared/example-surfaces.js';
import { dogfoodText } from './story-preview-style.js';

const STORY_PREVIEW_BADGE_TONES = {
  success: { tone: 'success' },
} as const;

export function modalBackdrop(width: number, ctx: BijouContext): Surface {
  const innerWidth = Math.max(28, width - 4);
  const content = textSurface([
    dogfoodText(undefined, 'stories.preview.modal.releaseQueue', 'Release queue'),
    '',
    `  ${dogfoodText(undefined, 'stories.preview.modal.web', 'web')}`,
    `  ${dogfoodText(undefined, 'stories.preview.modal.api', 'api')}`,
    `  ${dogfoodText(undefined, 'stories.preview.modal.workers', 'workers')}`,
    '',
    `  ${kbd('d', { ctx })} ${dogfoodText(undefined, 'stories.preview.modal.deploy', 'deploy')}  ${kbd('?', { ctx })} ${dogfoodText(undefined, 'stories.preview.modal.help', 'help')}  ${kbd('q', { ctx })} ${dogfoodText(undefined, 'stories.preview.modal.quit', 'quit')}`,
  ].join('\n'), Math.max(1, innerWidth - 2), 12);
  return screenSurface(width, 14, boxSurface(content, {
    title: dogfoodText(undefined, 'stories.preview.modal.title', 'release-workbench'),
    width: innerWidth,
    ctx,
  }));
}

export function toastBackdrop(width: number, height: number, ctx: BijouContext): Surface {
  const panel = boxSurface(column([
    row([
      dogfoodText(undefined, 'stories.preview.toast.releaseQueue', 'release queue  '),
      badgeSurface(dogfoodText(undefined, 'stories.preview.toast.live', 'LIVE'), STORY_PREVIEW_BADGE_TONES.success.tone, ctx),
    ]),
    spacer(),
    line(dogfoodText(undefined, 'stories.preview.toast.canariesStable', 'Canaries stable in eu-west')),
    line(dogfoodText(undefined, 'stories.preview.toast.windowOpens', 'Promotion window opens in 4m')),
  ]), {
    title: dogfoodText(undefined, 'stories.preview.toast.title', 'release dashboard'),
    width: Math.max(28, width - 4),
    ctx,
  });
  return screenSurface(width, height, panel, 1, 1);
}

export function viewportPreviewSurface(
  width: number,
  content: string | Surface,
  scrollY: number,
  ctx: BijouContext,
  summaryLines: readonly string[],
): string | Surface {
  const viewportWidth = Math.max(24, width);
  const label = dogfoodText(undefined, 'stories.preview.viewport.label', 'viewport mask');
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      label,
      dogfoodText(undefined, 'stories.preview.viewport.scrollY', 'scrollY={value}', { value: scrollY }),
      dogfoodText(undefined, 'stories.preview.viewport.width', 'width={value}', { value: viewportWidth }),
      ...summaryLines,
    ].join('\n');
  }

  const header = separatorSurface({ label, width: viewportWidth, ctx });
  const body = viewportSurface({ width: viewportWidth, height: 9, content, scrollY, showScrollbar: true });
  return column([
    header,
    body,
    line(`  ${dogfoodText(undefined, 'stories.preview.viewport.metrics', 'scrollY={scrollY}  width={width}', {
      scrollY,
      width: viewportWidth,
    })}`, viewportWidth),
  ]);
}

export function pagerPreviewSurface(width: number, ctx: BijouContext): string | Surface {
  const paneWidth = Math.max(30, Math.min(width, 54));
  const title = dogfoodText(undefined, 'stories.preview.pager.title', 'release reader');
  const content = boxSurface(column([
    line(dogfoodText(undefined, 'stories.document.buildPlan.title', 'Build plan')),
    spacer(),
    line(dogfoodText(undefined, 'stories.document.buildPlan.step.resolveDependencies', '1. Resolve dependencies')),
    line(dogfoodText(undefined, 'stories.document.buildPlan.step.runMigrations', '2. Run migrations')),
    line(dogfoodText(undefined, 'stories.document.buildPlan.step.bakeArtifacts', '3. Bake artifacts')),
    line(dogfoodText(undefined, 'stories.document.buildPlan.step.rollCanaries', '4. Roll canaries')),
    line(dogfoodText(undefined, 'stories.document.buildPlan.step.promoteRelease', '5. Promote release')),
    spacer(),
    line(dogfoodText(undefined, 'stories.document.buildPlan.frameReplay', 'Each stage emits its own frame and can be replayed later.')),
    spacer(),
    line(dogfoodText(undefined, 'stories.preview.pager.statusAnchored', 'Pager status keeps long linear text anchored.')),
  ]), { title, width: paneWidth, ctx });
  const state = createPagerStateForSurface(content, { width: paneWidth, height: 10 });
  const scrollY = Math.min(3, state.scroll.maxY);
  const panelTitle = dogfoodText(undefined, 'stories.preview.pager.panelTitle', 'pager surface');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      panelTitle,
      dogfoodText(undefined, 'stories.preview.pager.lineCounter', 'Line {line}/{total}', {
        line: scrollY + 1,
        total: content.height,
      }),
      title,
      dogfoodText(undefined, 'stories.preview.pager.runMigrations', 'Run migrations'),
      dogfoodText(undefined, 'stories.preview.pager.promoteRelease', 'Promote release'),
    ].join('\n');
  }

  return boxSurface(pagerSurface(content, {
    ...state,
    scroll: { ...state.scroll, y: scrollY },
  }, {
    showScrollbar: true,
    showStatus: true,
  }), { title: panelTitle, width: paneWidth + 2, ctx });
}
