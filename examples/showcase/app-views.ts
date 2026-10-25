import type { BijouContext, Surface } from '@flyingrobots/bijou';
import { box, kbd, markdown } from '@flyingrobots/bijou';
import { browsableListSurface } from '@flyingrobots/bijou-tui';
import type { ShowcasePageModel } from './types.js';
import { CATEGORIES, findEntry, type Category } from './registry.js';
import { triModePreview } from './tri-mode.js';

function tierLabel(tier: number): string {
  if (tier === 1) return 'static';
  if (tier === 2) return 'embeddable';
  return 'standalone';
}

export function renderDetail(
  componentId: string | undefined,
  width: number,
  height: number,
  ctx: BijouContext,
): string {
  if (componentId == null) {
    return renderWelcomeContent(width, height, ctx);
  }
  const entry = findEntry(componentId);
  if (entry == null) {
    return '  Component not found.';
  }

  const innerW = Math.max(20, width - 2);
  const sections: string[] = [];

  // Header
  sections.push(markdown(entry.description, { width: innerW, ctx }));
  sections.push('');

  // Tier + package badge
  sections.push(`  Tier: ${tierLabel(entry.tier)} · Package: ${entry.pkg}`);
  sections.push('');

  // Tri-mode preview
  sections.push(triModePreview(entry.render, innerW, ctx));

  return sections.join('\n');
}

function renderWelcomeContent(width: number, _height: number, ctx: BijouContext): string {
  const w = Math.max(20, Math.min(52, width));
  return [
    '',
    '',
    box([
      '  Select a component from the sidebar',
      '  to see its live preview and docs.',
      '',
      `  ${kbd('up', { ctx })}/${kbd('down', { ctx })}  Navigate sidebar`,
      `  ${kbd('[', { ctx })}/${kbd(']', { ctx })}     Switch categories`,
      `  ${kbd('tab', { ctx })}      Focus pane`,
      `  ${kbd('j', { ctx })}/${kbd('k', { ctx })}     Scroll content`,
      `  ${kbd('?', { ctx })}        Help`,
      `  ${kbd('q', { ctx })}        Quit`,
    ].join('\n'), {
      width: w,
      borderToken: ctx.border('muted'),
      ctx,
    }),
  ].join('\n');
}

export function renderSidebar(
  model: ShowcasePageModel,
  width: number,
  height: number,
  category: Category,
  ctx: BijouContext,
): Surface {
  const viewportHeight = Math.max(1, height);
  const state = model.listState.height === viewportHeight
    ? model.listState
    : { ...model.listState, height: viewportHeight };

  return browsableListSurface(state, {
    width: Math.max(1, width),
    showScrollbar: state.items.length > state.height,
    ctx,
    renderItem: ({ item, focused }) => {
      const itemValue = typeof item.value === 'string' ? item.value : '';
      const entry = findEntry(itemValue);
      const tierMark = (entry?.tier ?? 1) === 3 ? ' *' : '';
      const label = `${focused ? '>' : ' '} ${item.label}${tierMark}`;
      return focused ? ctx.style.styled(ctx.semantic('primary'), label) : label;
    },
  });
}

export function renderDrawerContent(ctx: BijouContext): string {
  const total = CATEGORIES.reduce((n, c) => n + c.entries.length, 0);
  return [
    'Bijou Component Showcase',
    '',
    `${String(total)} components across`,
    `${String(CATEGORIES.length)} categories.`,
    '',
    `${kbd('up', { ctx })}/${kbd('down', { ctx })}  Navigate`,
    `${kbd('[', { ctx })}/${kbd(']', { ctx })}     Categories`,
    `${kbd('tab', { ctx })}      Focus pane`,
    `${kbd('j', { ctx })}/${kbd('k', { ctx })}     Scroll detail`,
    `${kbd('ctrl+p', { ctx })} Command palette`,
    `${kbd('?', { ctx })}        Full help`,
    `${kbd('o', { ctx })}        Close this drawer`,
    `${kbd('q', { ctx })}        Quit`,
    '',
    '* = standalone only',
  ].join('\n');
}
