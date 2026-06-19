import {
  boxSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  createFocusAreaStateForSurface,
  focusAreaSurface,
} from '../../packages/bijou-tui/src/index.js';
import {
  column,
  spacer,
} from '../_shared/example-surfaces.js';
import { dogfoodText } from './story-preview-style.js';

export function focusedPanePreviewSurface(width: number, ctx: BijouContext): string | Surface {
  const paneWidth = Math.max(30, Math.min(width, 54));
  const inspectorTitle = dogfoodText(undefined, 'stories.preview.focus.inspectorTitle', 'Inspector notes');
  const warningsTitle = dogfoodText(undefined, 'stories.preview.focus.warningsTitle', 'Warnings');
  const actionsTitle = dogfoodText(undefined, 'stories.preview.focus.actionsTitle', 'Actions');
  const content = column([
    boxSurface(dogfoodText(undefined, 'stories.preview.focus.signals', 'Signals\n\n- db healthy\n- cache warm\n- queue low'), { title: inspectorTitle, width: paneWidth - 2, ctx }),
    spacer(),
    boxSurface(dogfoodText(undefined, 'stories.preview.focus.warnings', 'Warnings\n\n- migration is slow\n- stale preview'), { title: warningsTitle, width: paneWidth - 2, ctx }),
    spacer(),
    boxSurface(dogfoodText(undefined, 'stories.preview.focus.actions', 'Actions\n\n- confirm deploy\n- watch rollout'), { title: actionsTitle, width: paneWidth - 2, ctx }),
  ]);
  const state = createFocusAreaStateForSurface(content, { width: paneWidth, height: 9 });
  const scrollY = Math.min(2, state.scroll.maxY);
  const panelTitle = dogfoodText(undefined, 'stories.preview.focus.panelTitle', 'focused pane');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      panelTitle,
      dogfoodText(undefined, 'stories.preview.focus.focused', 'focused=true'),
      dogfoodText(undefined, 'stories.preview.focus.scrollY', 'scrollY={value}', { value: scrollY }),
      inspectorTitle,
      warningsTitle,
      actionsTitle,
    ].join('\n');
  }

  return boxSurface(focusAreaSurface(content, {
    ...state,
    scroll: { ...state.scroll, y: scrollY },
  }, {
    focused: true,
    ctx,
    id: 'docs-inspector',
  }), { title: panelTitle, width: paneWidth + 2, ctx });
}
