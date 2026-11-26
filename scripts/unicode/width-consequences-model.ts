import type { CorpusSource } from './width-corpus.js';
import type { WidthUcd } from './width-ucd.js';

/** Width of one grapheme cluster under one table. */
export type ClusterWidth = (cluster: string) => number;

/** One group of width changes: a block and a direction. */
export interface ChangeGroup {
  readonly kind: 'code-point' | 'cluster';
  readonly source: string;
  readonly block: string;
  readonly direction: string;
  readonly count: number;
  readonly eastAsianWidth: Readonly<Record<string, number>>;
  readonly examples: readonly string[];
}

/** Counts of distinct clusters measured and changed, per source. */
export interface SourceSummary {
  readonly source: string;
  readonly clusters: number;
  readonly changed: number;
  readonly multiClusterStrings: number;
}

const EXAMPLES = 3;
const u = (cp: number): string => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
const describe = (cluster: string): string =>
  `${Array.from(cluster).map((ch) => u(ch.codePointAt(0) ?? 0)).join(' ')} ${cluster}`;

interface MutableGroup {
  count: number;
  eastAsianWidth: Record<string, number>;
  examples: string[];
}

class Grouper {
  private readonly groups = new Map<string, MutableGroup & Omit<ChangeGroup, 'count' | 'eastAsianWidth' | 'examples'>>();

  add(kind: ChangeGroup['kind'], source: string, block: string, direction: string, eaw: string, example: string): void {
    const key = `${kind}\u0000${source}\u0000${block}\u0000${direction}`;
    let group = this.groups.get(key);
    if (group === undefined) {
      group = { kind, source, block, direction, count: 0, eastAsianWidth: {}, examples: [] };
      this.groups.set(key, group);
    }
    group.count += 1;
    group.eastAsianWidth[eaw] = (group.eastAsianWidth[eaw] ?? 0) + 1;
    if (group.examples.length < EXAMPLES) group.examples.push(example);
  }

  list(): readonly ChangeGroup[] {
    return [...this.groups.values()].sort((a, b) =>
      a.kind.localeCompare(b.kind) || a.source.localeCompare(b.source) || b.count - a.count ||
      a.block.localeCompare(b.block) || a.direction.localeCompare(b.direction));
  }
}

/** Compare two cluster-width functions over every assigned code point and every corpus string. */
export function compareWidths(options: {
  readonly ucd: WidthUcd;
  readonly corpus: readonly CorpusSource[];
  readonly before: ClusterWidth;
  readonly after: ClusterWidth;
  readonly segment: (text: string) => Iterable<string>;
}): { readonly groups: readonly ChangeGroup[]; readonly sources: readonly SourceSummary[] } {
  const { ucd, before, after } = options;
  const grouper = new Grouper();
  const eawOf = (cp: number): string => ucd.assigned.get(cp)?.eastAsianWidth ?? 'unassigned';
  let changedCodePoints = 0;
  for (const cp of ucd.assigned.keys()) {
    const ch = String.fromCodePoint(cp);
    const [was, now] = [before(ch), after(ch)];
    if (was === now) continue;
    changedCodePoints += 1;
    grouper.add('code-point', 'assigned', ucd.blockOf(cp), `${String(was)}->${String(now)}`, eawOf(cp), describe(ch));
  }
  const sources: SourceSummary[] = [
    { source: 'assigned', clusters: ucd.assigned.size, changed: changedCodePoints, multiClusterStrings: 0 },
  ];
  const statuses = [...new Set(ucd.emojiSequences.map((entry) => entry.status))];
  const corpus = [...options.corpus, ...statuses.map((status) => ({
    source: `emoji-test ${status}`,
    strings: ucd.emojiSequences.filter((entry) => entry.status === status).map((entry) => entry.sequence),
  }))];
  for (const { source, strings } of corpus) {
    const seen = new Set<string>();
    let changed = 0;
    let multiClusterStrings = 0;
    for (const text of strings) {
      const clusters = [...options.segment(text)];
      if (source.startsWith('emoji-test') && clusters.length > 1) multiClusterStrings += 1;
      for (const cluster of clusters) {
        if (seen.has(cluster)) continue;
        seen.add(cluster);
        const [was, now] = [before(cluster), after(cluster)];
        if (was === now) continue;
        changed += 1;
        const responsible = Array.from(cluster).map((ch) => ch.codePointAt(0) ?? 0)
          .find((cp) => before(String.fromCodePoint(cp)) !== after(String.fromCodePoint(cp))) ?? 0;
        grouper.add('cluster', source, ucd.blockOf(responsible), `${String(was)}->${String(now)}`,
          eawOf(responsible), describe(cluster));
      }
    }
    sources.push({ source, clusters: seen.size, changed, multiClusterStrings });
  }
  return { groups: grouper.list(), sources };
}
