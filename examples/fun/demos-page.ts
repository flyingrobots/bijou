// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The Demos page of the fun app: a browsable list of every demo beside the
// selected one running live. With the list focused, the arrows or j and k
// choose a demo and Enter plays it full-pane. Tab focuses the demo pane, which
// then gets the demo's own keys and the pointer, all but the frame's reserved
// keys. A full-pane demo gets every key; Escape comes back to the list.
import type { BijouContext } from '@flyingrobots/bijou';
import {
  browsableListSurface, createBrowsableListState, createKeyMap, createSplitPaneState, isPulseMsg, listFocusNext, listFocusPrev,
  type BrowsableListState, type FramePage, type KeyMap, type KeyMsg,
} from '@flyingrobots/bijou-tui';
import type { DemoEntry, Session } from './contract.js';
import type { DemosModel, FunModel, FunMsg } from './fun-app-types.js';
import { typed } from './shell-chrome.js';

/** Keys the frame keeps even while the demo pane is focused: focus, help, settings, inspectors, palette and quit. */
const FRAME_RESERVED = new Set(['tab', 'shift+tab', '?', '`', 'f2', 'f9', 'ctrl+p', ':', 'q', 'ctrl+c', 'ctrl+,']);

function descriptor(msg: KeyMsg): string {
  return `${msg.ctrl ? 'ctrl+' : ''}${msg.alt ? 'alt+' : ''}${msg.shift ? 'shift+' : ''}${msg.key}`;
}

/** The demo pane's key map: every key but the frame's reserved ones goes to the running demo. */
export function demoPaneKeys(): KeyMap<FunMsg> {
  const base = createKeyMap<FunMsg>();
  return { ...base, handle: (msg: KeyMsg) => (FRAME_RESERVED.has(descriptor(msg)) ? undefined : { type: 'demos-key', key: typed(msg) }) };
}

/** The key map while a demo plays: Escape comes back to the list, every other key goes to the demo. */
export function playingKeys(): KeyMap<FunMsg> {
  const base = createKeyMap<FunMsg>().bind('escape', 'Back to the list', { type: 'demos-stop' });
  return { ...base, handle: (msg: KeyMsg) => base.handle(msg) ?? { type: 'demos-key', key: typed(msg) } };
}

export function demosPage({ ctx, entries, seed }: {
  readonly ctx: BijouContext; readonly entries: readonly DemoEntry[]; readonly seed: number;
}): FramePage<FunModel, FunMsg> {
  const first = entries[0];
  if (first === undefined) throw new Error('the fun app needs at least one demo');
  // The pane size the layout last painted. Render runs in the view and the model changes in update, so the next
  // pulse carries a new size to the demo as a resize message.
  const painted = { width: 0, height: 0 };
  const mount = (index: number): Session => (entries[index] ?? first).mount(seed);
  const select = (model: DemosModel, list: BrowsableListState<number>): DemosModel =>
    ({ ...model, list, session: mount(list.focusIndex), pane: { width: 0, height: 0 } });
  const keys = playingKeys();
  const paneKeys = demoPaneKeys();
  return {
    id: 'demos',
    title: 'Demos',
    init: () => [{
      kind: 'demos',
      list: createBrowsableListState({ items: entries.map((entry, index) => ({ label: entry.name, value: index })), height: 40 }),
      split: createSplitPaneState({ ratio: 0.26 }),
      session: mount(0),
      playing: false,
      pane: { width: 0, height: 0 },
    }, []],
    update(msg, model) {
      if (model.kind !== 'demos') return [model, []];
      if (isPulseMsg(msg)) {
        const sized = painted.width === model.pane.width && painted.height === model.pane.height ? model
          : { ...model, pane: { ...painted }, session: model.session.update({ type: 'resize', width: painted.width, height: painted.height }) };
        return [{ ...sized, session: sized.session.update({ type: 'pulse', dt: msg.dt }) }, []];
      }
      switch (msg.type) {
        case 'mouse':
          return model.playing ? [{ ...model, session: model.session.update({ type: 'pointer', col: msg.col, row: Math.max(0, msg.row - 1) }) }, []] : [model, []];
        case 'demos-next': return [select(model, listFocusNext(model.list)), []];
        case 'demos-prev': return [select(model, listFocusPrev(model.list)), []];
        case 'demos-play': return [{ ...model, playing: true }, []];
        case 'demos-stop': return [{ ...model, playing: false }, []];
        case 'demos-key': return [{ ...model, session: model.session.update({ type: 'key', key: msg.key }) }, []];
        case 'demos-pointer': return [{ ...model, session: model.session.update({ type: 'pointer', col: msg.col, row: msg.row }) }, []];
        case 'demos-panel': return [{ ...model, session: model.session.update({ type: 'key', key: 'h' }) }, []];
        // The Home page's messages mean nothing here.
        case 'open': case 'toggle-wordmark': case 'toggle-motion': return [model, []];
      }
    },
    keyMap: createKeyMap<FunMsg>()
      .bind('down', 'Next demo', { type: 'demos-next' })
      .bind('j', 'Next demo', { type: 'demos-next' })
      .bind('up', 'Previous demo', { type: 'demos-prev' })
      .bind('k', 'Previous demo', { type: 'demos-prev' })
      .bind('enter', 'Play the demo', { type: 'demos-play' }),
    modalKeyMap: (model) => (model.kind === 'demos' && model.playing ? keys : undefined),
    // The focused demo pane owns its keys and the pointer, in the pane's own cells.
    inputAreas: () => [{
      paneId: 'demo',
      keyMap: paneKeys,
      mouse: ({ msg, rect }) => ({ type: 'demos-pointer', col: msg.col - rect.col, row: msg.row - rect.row }),
    }],
    layout: (model) => {
      const session = model.kind === 'demos' ? model.session : mount(0);
      const demo = (width: number, height: number) => {
        painted.width = width;
        painted.height = height;
        return session.view(width, height, ctx);
      };
      if (model.kind !== 'demos' || model.playing) return { kind: 'pane', paneId: 'demo', render: demo };
      return {
        kind: 'split', splitId: 'demos', state: model.split,
        paneA: { kind: 'pane', paneId: 'list', render: (width) => browsableListSurface(model.list, { width, ctx }) },
        paneB: { kind: 'pane', paneId: 'demo', render: demo },
      };
    },
  };
}
