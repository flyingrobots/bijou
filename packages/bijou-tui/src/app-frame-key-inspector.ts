import { boxSurface, type BijouContext } from '@flyingrobots/bijou';
import { formatKeyCombo, type BindingInfo, type KeyMap } from './keybindings.js';
import type { Overlay } from './overlay.js';
import type { FrameLayerContext } from './app-frame-layer-context.js';

/** Where the frame sent one key: the route it took and what it was. */
export interface FrameKeyLogEntry {
  readonly key: string;
  readonly route: 'palette' | 'help' | 'frame' | 'global' | 'page' | 'unhandled';
}

/** One source of key bindings, in the order the frame consults them for the active layer. */
export interface FrameKeySource {
  readonly name: string;
  readonly bindings: readonly FrameKeyInspectorBinding[];
}

export interface FrameKeyInspectorBinding {
  readonly key: string;
  readonly description: string;
  readonly enabled: boolean;
  /** The earlier source that takes this key first, so this binding never fires; undefined when it is live. */
  readonly shadowedBy?: string;
  /** What the winning binding in that source does. */
  readonly shadowedByDescription?: string;
}

export interface FrameKeyInspectorReport {
  readonly layer: string;
  readonly keyPriority: 'frame-first' | 'page-first';
  readonly sources: readonly FrameKeySource[];
  readonly recent: readonly FrameKeyLogEntry[];
}

const MAX_LOG = 8;

/** Keep the last few routed keys, newest last. */
export function appendFrameKeyLog(log: readonly FrameKeyLogEntry[], entry: FrameKeyLogEntry): readonly FrameKeyLogEntry[] {
  return [...log, entry].slice(-MAX_LOG);
}

const combo = (binding: BindingInfo): string => formatKeyCombo(binding.combo);

/**
 * The key sources live in the active layer, in the frame's routing order, with each binding marked when an earlier
 * source already answers its key. A page modal key map takes every key but the perf HUD and inspector toggles.
 */
export function frameKeyInspectorReport<PageModel, Msg>(input: {
  readonly context: FrameLayerContext<PageModel, Msg>;
  readonly frameKeys: KeyMap<unknown>;
  readonly globalKeys: KeyMap<Msg> | undefined;
  readonly keyPriority: 'frame-first' | 'page-first' | undefined;
  readonly recent: readonly FrameKeyLogEntry[];
}): FrameKeyInspectorReport {
  const { context } = input;
  const keyPriority = input.keyPriority ?? 'frame-first';
  const named = (name: string, map: { bindings(): readonly BindingInfo[] } | undefined): readonly [string, readonly BindingInfo[]] =>
    [name, map?.bindings() ?? []];
  const pane = named(`pane ${context.activeInputArea?.paneId ?? '-'}`, context.activeInputArea?.keyMap);
  const page = named(`page ${context.activePage.id}`, context.activePage.keyMap);
  const global = named('global', input.globalKeys);
  const frame = named('frame', input.frameKeys);
  const ordered: readonly (readonly [string, readonly BindingInfo[]])[] = context.pageModalOpen
    ? [named(`page ${context.activePage.id} modal`, context.modalKeyMap)]
    : keyPriority === 'page-first' ? [pane, page, global, frame] : [frame, pane, global, page];
  const taken = new Map<string, { readonly source: string; readonly description: string }>();
  const sources = ordered.map(([name, bindings]) => ({
    name,
    bindings: bindings.map((binding) => {
      const key = combo(binding);
      const owner = binding.enabled ? taken.get(key) : undefined;
      if (binding.enabled && owner === undefined) taken.set(key, { source: name, description: binding.description });
      return owner === undefined
        ? { key, description: binding.description, enabled: binding.enabled }
        : { key, description: binding.description, enabled: binding.enabled, shadowedBy: owner.source, shadowedByDescription: owner.description };
    }),
  }));
  return { layer: context.activeLayer.kind, keyPriority, sources, recent: input.recent };
}

/**
 * The report as lines, most useful first: layer and priority, the last keys and where each went, every binding that
 * can never fire and what takes its key, then each source in routing order with its bindings.
 */
export function frameKeyInspectorLines(report: FrameKeyInspectorReport): string[] {
  const lines = [`layer ${report.layer} · ${report.keyPriority}`, '', 'recent keys'];
  if (report.recent.length === 0) lines.push('  (press a key)');
  for (const entry of [...report.recent].reverse()) lines.push(`  ${entry.key.padEnd(12)} → ${entry.route}`);
  const shadowed = report.sources.flatMap((source) =>
    source.bindings.flatMap((binding) => (binding.shadowedBy === undefined ? [] : [{ source: source.name, binding }])));
  lines.push('', `shadowed (${String(shadowed.length)})`);
  if (shadowed.length === 0) lines.push('  none');
  for (const { source, binding } of shadowed) {
    lines.push(`  ${binding.key.padEnd(8)} ${source}: ${binding.description} ✗ ${binding.shadowedBy ?? '?'} (${binding.shadowedByDescription ?? '?'})`);
  }
  for (const source of report.sources) {
    lines.push('', `${source.name} (${String(source.bindings.length)})`);
    for (const binding of source.bindings) {
      const state = binding.shadowedBy !== undefined ? '  ✗' : binding.enabled ? '' : '  (off)';
      lines.push(`  ${binding.key.padEnd(12)} ${binding.description}${state}`);
    }
  }
  return lines;
}

/** The inspector as an overlay on the right of the screen, between the header and footer rows. */
export function renderFrameKeyInspectorOverlay(
  report: FrameKeyInspectorReport,
  screen: { readonly columns: number; readonly rows: number },
  ctx?: BijouContext,
): Overlay {
  const width = Math.max(24, Math.min(56, screen.columns - 2));
  // Below the header row and above the footer row: one row each, plus the box's two border rows.
  const room = Math.max(3, screen.rows - 4);
  const lines = frameKeyInspectorLines(report);
  const shown = lines.length <= room ? lines : [...lines.slice(0, room - 1), `… ${String(lines.length - room + 1)} more`];
  const surface = boxSurface(shown.join('\n'), {
    title: 'Key Inspector',
    width,
    borderToken: ctx?.border('primary'),
    bgToken: ctx?.surface('elevated'),
    ctx,
  });
  return { content: '', surface, row: 1, col: Math.max(0, screen.columns - width - 1) };
}
