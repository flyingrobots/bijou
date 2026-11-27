import { boxSurface, type BijouContext } from '@flyingrobots/bijou';
import type { KeyMap } from './keybindings.js';
import type { Overlay } from './overlay.js';
import type { KeyMsg } from './types.js';
import type { FrameLayerContext } from './app-frame-layer-context.js';
import { frameKeyInspectorReport, type FrameKeyInspectorReport } from './app-frame-key-inspector.js';

/** The debug-mode halt: the active layer has key bindings that can never fire. */
export interface FrameShadowAlert {
  /** Which page and layer the conflicts belong to, so an acknowledgement covers only them. */
  readonly scope: string;
  /** The conflicts, one per shadowed binding, as an identity to compare against an acknowledgement. */
  readonly signature: string;
  /** How many bindings can never fire. */
  readonly count: number;
  /** For each conflict: what never fires, which binding takes its key and why, and how to fix it. */
  readonly lines: readonly string[];
}

export interface FrameShadowState {
  readonly shadowAlert?: FrameShadowAlert | undefined;
  /** For each scope, the signature of the conflicts already acknowledged there. */
  readonly shadowAcknowledged?: Readonly<Record<string, string>> | undefined;
}

const FREE_CANDIDATES: readonly string[] = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
  ...Array.from({ length: 10 }, (_, i) => String(i)),
];

/** A key no enabled binding in any source uses, preferring the initials of the words in `description`. */
function freeKeyFor(report: FrameKeyInspectorReport, description: string): string | undefined {
  const used = new Set(report.sources.flatMap((source) => source.bindings.filter((b) => b.enabled).map((b) => b.key.toLowerCase())));
  const initials = description.toLowerCase().split(/\s+/u).map((word) => word.charAt(0)).filter((c) => /[a-z0-9]/u.test(c));
  return [...initials, ...FREE_CANDIDATES].find((candidate) => !used.has(candidate));
}

/** Why the winning source gets the key first. */
function whyItWins(report: FrameKeyInspectorReport, victim: string, owner: string): string {
  if (victim === owner) return 'bound twice; the first wins';
  if (victim.endsWith(' modal')) return 'the modal key map takes every key';
  return `asked first under '${report.keyPriority}'`;
}

/** How to make the shadowed binding fire. */
function howToFix(report: FrameKeyInspectorReport, victim: string, owner: string, description: string): string {
  const free = freeKeyFor(report, description);
  const rebind = free === undefined ? `rebind "${description}"` : `bind "${description}" to ${free}`;
  if (victim === owner) return `${rebind}, or remove the duplicate`;
  if (owner === 'frame' && report.keyPriority === 'frame-first') return `${rebind}, or pass keyPriority: 'page-first'`;
  if (victim === 'frame') return `rebind the ${owner} binding, or keyPriority: 'frame-first'`;
  return `${rebind}, or move it to the source asked first`;
}

/** The shadowed bindings of a report as alert lines and a stable signature; undefined when there are none. */
function conflicts(report: FrameKeyInspectorReport): { readonly signature: string; readonly count: number; readonly lines: readonly string[] } | undefined {
  // Under page-first a page binding that takes a frame key is a deliberate override, not a bug: it does not halt.
  const deliberate = (source: string): boolean => source === 'frame' && report.keyPriority === 'page-first';
  const found = report.sources.flatMap((source) =>
    source.bindings.flatMap((binding) => (binding.shadowedBy === undefined || deliberate(source.name) ? [] : [{ source: source.name, binding }])));
  if (found.length === 0) return undefined;
  return {
    signature: found.map(({ source, binding }) => `${source}|${binding.key}|${binding.shadowedBy ?? ''}`).join('\n'),
    count: found.length,
    lines: found.flatMap(({ source, binding }, index) => {
      const owner = binding.shadowedBy ?? '?';
      return [
        ...(index === 0 ? [] : ['']),
        `${binding.key} — ${source}: "${binding.description}" never fires`,
        `  bad guy: ${owner} "${binding.shadowedByDescription ?? '?'}" — ${whyItWins(report, source, owner)}`,
        `  fix: ${howToFix(report, source, owner, binding.description)}`,
      ];
    }),
  };
}

/**
 * The alert the frame should show now, if any: the active layer's shadowed bindings, unless those exact conflicts were
 * already acknowledged for this page and layer. An open alert stays open until it is acknowledged.
 */
export function detectFrameShadowAlert<PageModel, Msg>(
  state: FrameShadowState,
  input: {
    readonly activePageId: string;
    readonly context: FrameLayerContext<PageModel, Msg>;
    readonly frameKeys: KeyMap<unknown>;
    readonly globalKeys: KeyMap<Msg> | undefined;
    readonly keyPriority: 'frame-first' | 'page-first' | undefined;
  },
): FrameShadowAlert | undefined {
  if (state.shadowAlert !== undefined) return state.shadowAlert;
  const report = frameKeyInspectorReport({ ...input, recent: [] });
  const found = conflicts(report);
  if (found === undefined) return undefined;
  const scope = `${input.activePageId}|${input.context.pageModalOpen ? 'modal' : report.layer}`;
  if (state.shadowAcknowledged?.[scope] === found.signature) return undefined;
  return { scope, signature: found.signature, count: found.count, lines: found.lines };
}

/** What a key does while the alert is open: acknowledge it, open the key inspector, or nothing at all. */
export function shadowAlertKeyAction(msg: KeyMsg): 'acknowledge' | 'inspect' | 'hold' {
  if (msg.ctrl || msg.alt) return 'hold';
  if (msg.key === 'enter' || msg.key === 'escape') return 'acknowledge';
  return msg.key === 'f9' ? 'inspect' : 'hold';
}

/** The state after the alert is acknowledged: closed, and these conflicts remembered for its scope. */
export function acknowledgeFrameShadowAlert(state: FrameShadowState): FrameShadowState {
  const alert = state.shadowAlert;
  if (alert === undefined) return state;
  return { shadowAlert: undefined, shadowAcknowledged: { ...state.shadowAcknowledged, [alert.scope]: alert.signature } };
}

/** The alert as a modal box centred on the screen. */
export function renderFrameShadowAlertOverlay(
  alert: FrameShadowAlert,
  screen: { readonly columns: number; readonly rows: number },
  ctx?: BijouContext,
): Overlay {
  const width = Math.max(30, Math.min(88, screen.columns - 4));
  const room = Math.max(1, screen.rows - 10);
  const listed = alert.lines.length <= room ? alert.lines : [...alert.lines.slice(0, room - 1), `… ${String(alert.lines.length - room + 1)} more`];
  const body = [
    `${String(alert.count)} key binding${alert.count === 1 ? '' : 's'} can never fire here:`,
    '',
    ...listed,
    '',
    'The app is halted. Enter or Esc continues; F9 opens the key inspector.',
  ].join('\n');
  const surface = boxSurface(body, {
    title: 'Debug: shadowed key bindings',
    width,
    borderToken: ctx?.status('warning'),
    bgToken: ctx?.surface('elevated'),
    ctx,
  });
  return {
    content: '',
    surface,
    row: Math.max(1, Math.floor((screen.rows - surface.height) / 2)),
    col: Math.max(0, Math.floor((screen.columns - width) / 2)),
  };
}
