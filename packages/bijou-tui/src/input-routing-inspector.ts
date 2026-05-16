import { stringToSurface, type LayoutNode, type Surface } from '@flyingrobots/bijou';
import type {
  RuntimeInputEvent,
  RuntimeInputRouteResult,
} from './runtime-engine.js';

export interface InputRoutingInspectorRecord<
  Command = string,
  Effect = string,
  Node extends LayoutNode = LayoutNode,
> {
  readonly rawInput?: string;
  readonly atMs?: number;
  readonly event: RuntimeInputEvent;
  readonly result: RuntimeInputRouteResult<Command, Effect, Node>;
  readonly commandLabels?: readonly string[];
  readonly effectLabels?: readonly string[];
}

export interface InputRoutingInspectorHistory<
  Command = string,
  Effect = string,
  Node extends LayoutNode = LayoutNode,
> {
  readonly records: readonly InputRoutingInspectorRecord<Command, Effect, Node>[];
}

export interface InputRoutingInspectorHistoryOptions {
  readonly maxEvents?: number;
}

export interface InputRoutingInspectorSurfaceOptions {
  readonly width?: number;
  readonly height?: number;
}

const DEFAULT_MAX_EVENTS = 20;
const DEFAULT_SURFACE_WIDTH = 80;
const MIN_EVENT_COUNT = 1;
const MIN_SURFACE_WIDTH = 1;
const MIN_SURFACE_HEIGHT = 1;
const EMPTY_LABEL = '-';
const PATH_SEPARATOR = '>';
const LABEL_SEPARATOR = ',';

export function appendInputRoutingRecord<
  Command = string,
  Effect = string,
  Node extends LayoutNode = LayoutNode,
>(
  history: InputRoutingInspectorHistory<Command, Effect, Node>,
  record: InputRoutingInspectorRecord<Command, Effect, Node>,
  options: InputRoutingInspectorHistoryOptions = {},
): InputRoutingInspectorHistory<Command, Effect, Node> {
  const maxEvents = sanitizePositiveInteger(options.maxEvents, DEFAULT_MAX_EVENTS);
  const records = [...history.records, record];

  return {
    records: records.slice(Math.max(0, records.length - maxEvents)),
  };
}

export function inputRoutingInspectorText(
  history: InputRoutingInspectorHistory,
): string {
  const lines = [`input routing: ${history.records.length} events`];

  history.records.forEach((record, index) => {
    lines.push(inputRoutingRecordLine(record, index));
  });

  return lines.join('\n');
}

export function inputRoutingInspectorSurface(
  history: InputRoutingInspectorHistory,
  options: InputRoutingInspectorSurfaceOptions = {},
): Surface {
  const text = inputRoutingInspectorText(history);
  const lineCount = text.split('\n').length;
  const width = sanitizePositiveInteger(options.width, DEFAULT_SURFACE_WIDTH);
  const height = sanitizePositiveInteger(options.height, Math.max(MIN_SURFACE_HEIGHT, lineCount));
  return stringToSurface(text, Math.max(MIN_SURFACE_WIDTH, width), height);
}

function inputRoutingRecordLine(
  record: InputRoutingInspectorRecord,
  index: number,
): string {
  const result = record.result;
  const swallowed = !result.handled && result.stoppedByViewId !== undefined;
  const noop = result.handled && result.commands.length === 0 && result.effects.length === 0;
  const raw = record.rawInput === undefined ? '' : ` raw=${record.rawInput}`;
  const handledBy = result.handledByViewId ?? EMPTY_LABEL;
  const stoppedBy = result.stoppedByViewId ?? EMPTY_LABEL;
  const node = result.handledByNodeId ?? EMPTY_LABEL;
  const hit = result.hit?.target.id ?? EMPTY_LABEL;
  const visited = result.visitedViewIds.length === 0
    ? EMPTY_LABEL
    : result.visitedViewIds.join(PATH_SEPARATOR);

  return [
    `[${index + 1}]`,
    `${inputEventLabel(record.event)}${raw}`,
    `handled=${String(result.handled)}`,
    `visited=${visited}`,
    `handledBy=${handledBy}`,
    `stoppedBy=${stoppedBy}`,
    `node=${node}`,
    `hit=${hit}`,
    `commands=${labelsOrCount(record.commandLabels, result.commands.length)}`,
    `effects=${labelsOrCount(record.effectLabels, result.effects.length)}`,
    `swallowed=${String(swallowed)}`,
    `noop=${String(noop)}`,
  ].join(' ');
}

function inputEventLabel(event: RuntimeInputEvent): string {
  if (event.kind === 'key') {
    return `key ${event.key}`;
  }

  return `pointer ${event.action} ${event.button ?? EMPTY_LABEL} ${event.x},${event.y}`;
}

function labelsOrCount(labels: readonly string[] | undefined, count: number): string {
  if (labels === undefined || labels.length === 0) {
    return String(count);
  }

  return labels.join(LABEL_SEPARATOR);
}

function sanitizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(MIN_EVENT_COUNT, Math.floor(value));
}
