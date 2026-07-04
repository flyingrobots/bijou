import { spawnSync } from 'node:child_process';

export interface ReleaseReadinessTrackerLabel {
  readonly name: string;
}

export type ReleaseReadinessTrackerItemKind = 'issue' | 'pull-request';

export interface ReleaseReadinessTrackerItemCommand {
  readonly kind: ReleaseReadinessTrackerItemKind;
  readonly command: string;
  readonly args: readonly string[];
}

export interface ReleaseReadinessTrackerItem {
  readonly kind?: ReleaseReadinessTrackerItemKind;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly labels?: readonly (string | ReleaseReadinessTrackerLabel)[];
  readonly url?: string;
}

export function readMilestoneTrackerItems(milestone: string, cwd: string): readonly ReleaseReadinessTrackerItem[] {
  const trackerItems: ReleaseReadinessTrackerItem[] = [];

  for (const query of buildMilestoneTrackerItemCommands(milestone)) {
    const result = spawnSync(query.command, query.args, {
      cwd,
      encoding: 'utf8',
    });

    const source = `${query.command} ${query.args[0] ?? ''} ${query.args[1] ?? ''}`.trim();
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`${source} exited with status ${String(result.status ?? 'null')}: ${result.stderr.trim()}`);
    }

    trackerItems.push(...parseTrackerItems(result.stdout, query.kind, source));
  }

  return Object.freeze(trackerItems);
}

export function buildMilestoneTrackerItemCommands(milestone: string): readonly ReleaseReadinessTrackerItemCommand[] {
  return Object.freeze([
    Object.freeze({
      kind: 'issue',
      command: 'gh',
      args: [
        'issue',
        'list',
        '--state',
        'all',
        '--milestone',
        milestone,
        '--limit',
        '1000',
        '--json',
        'number,title,state,labels,url',
      ],
    }),
    Object.freeze({
      kind: 'pull-request',
      command: 'gh',
      args: [
        'pr',
        'list',
        '--state',
        'all',
        '--search',
        `milestone:"${milestone}"`,
        '--limit',
        '1000',
        '--json',
        'number,title,state,labels,url',
      ],
    }),
  ]);
}

export function trackerItemLabelNames(item: ReleaseReadinessTrackerItem): readonly string[] {
  return Object.freeze((item.labels ?? []).map((label) => (
    typeof label === 'string' ? label : label.name
  )));
}

export function formatTrackerItems(items: readonly ReleaseReadinessTrackerItem[]): string {
  return items.map((item) => `#${String(item.number)}`).join(', ');
}

function parseTrackerItems(
  stdout: string,
  kind: ReleaseReadinessTrackerItemKind,
  source: string,
): readonly ReleaseReadinessTrackerItem[] {
  const parsed: unknown = JSON.parse(stdout);
  if (!Array.isArray(parsed)) throw new Error(`${source} did not return an array`);
  return Object.freeze(parsed.map((value) => {
    const item = requireJsonRecord(value, `${source} item`);
    const number = item['number'];
    const title = item['title'];
    const state = item['state'];
    const url = item['url'];
    if (typeof number !== 'number' || typeof title !== 'string' || typeof state !== 'string') {
      throw new Error(`${source} returned an item with an unexpected shape`);
    }
    const base = {
      kind,
      number,
      title,
      state,
      labels: parseTrackerLabels(item['labels']),
    };
    return Object.freeze(typeof url === 'string' ? { ...base, url } : base);
  }));
}

function parseTrackerLabels(value: unknown): readonly (string | ReleaseReadinessTrackerLabel)[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map((label) => {
    if (typeof label === 'string') return label;
    const record = requireJsonRecord(label, 'gh tracker label');
    const name = record['name'];
    if (typeof name !== 'string') throw new Error('gh tracker label is missing name');
    return { name };
  }));
}

function requireJsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} is not an object`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
