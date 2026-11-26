#!/usr/bin/env tsx
// Width consequences of the generated UAX #11 table (flyingrobots/bijou#860):
// the hand-written table of 7ba774c8 against the generated one, under the
// same cluster rule, over every assigned code point, the grapheme and layout
// test literals, the DOGFOOD catalogs and content, the book corpus and
// emoji-test.txt. Usage: npm run unicode:width-report [-- --human]
// Default output is JSON Lines; `--human` prints Markdown tables.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureGraphemeCluster } from '../../packages/bijou/src/core/text/grapheme.part03.js';
import { isWideChar } from '../../packages/bijou/src/core/text/grapheme.part01.js';
import { UCD_DIRECTORY, UCD_VERSION } from './east-asian-wide-build.js';
import { isLegacyWideChar } from './legacy-wide-table.js';
import { readRepositoryCorpus } from './width-corpus.js';
import { compareWidths, type ChangeGroup, type SourceSummary } from './width-consequences-model.js';
import { readWidthUcd } from './width-ucd.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const human = process.argv.includes('--human') || process.argv.includes('--humanize');
const write = (line: string): void => { process.stdout.write(`${line}\n`); };

function emit(kind: string, data: object): void {
  write(JSON.stringify({ kind: `unicode.width-report.${kind}`, ...data }));
}

function directionTotals(groups: readonly ChangeGroup[], kind: ChangeGroup['kind']): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const group of groups) {
    if (group.kind === kind) totals[group.direction] = (totals[group.direction] ?? 0) + group.count;
  }
  return totals;
}

const classes = (group: ChangeGroup): string =>
  Object.entries(group.eastAsianWidth).map(([name, count]) => `${name} ${String(count)}`).join(', ');

function printHuman(run: object, sources: readonly SourceSummary[], groups: readonly ChangeGroup[]): void {
  write('# Width consequences of the generated UAX #11 table\n');
  write(`\`${JSON.stringify(run)}\`\n`);
  write('| Source | Distinct clusters | Changed | emoji-test sequences split by the runtime |');
  write('| --- | ---: | ---: | ---: |');
  for (const s of sources) {
    write(`| ${s.source} | ${String(s.clusters)} | ${String(s.changed)} | ${String(s.multiClusterStrings)} |`);
  }
  for (const kind of ['code-point', 'cluster'] as const) {
    write(`\n## ${kind === 'code-point' ? 'Assigned code points' : 'Clusters from the corpora'}\n`);
    write(`Totals by direction: \`${JSON.stringify(directionTotals(groups, kind))}\`\n`);
    write('| Source | Block | Direction | Count | UAX #11 class | Examples |');
    write('| --- | --- | --- | ---: | --- | --- |');
    for (const g of groups.filter((group) => group.kind === kind)) {
      write(`| ${g.source} | ${g.block} | ${g.direction} | ${String(g.count)} | ${classes(g)} | ${g.examples.join('; ')} |`);
    }
  }
}

try {
  const ucd = readWidthUcd(ROOT, UCD_DIRECTORY);
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const result = compareWidths({
    ucd,
    corpus: readRepositoryCorpus(ROOT),
    before: (cluster) => measureGraphemeCluster(cluster, isLegacyWideChar),
    after: (cluster) => measureGraphemeCluster(cluster, isWideChar),
    segment: (text) => [...segmenter.segment(text)].map((part) => part.segment),
  });
  const run = {
    unicodeVersion: UCD_VERSION,
    runtime: { node: process.version, unicode: process.versions.unicode ?? 'unknown' },
    inputs: ucd.inputs,
    before: 'scripts/unicode/legacy-wide-table.ts (isWideChar at 7ba774c8)',
    after: 'packages/bijou/src/core/text/generated/east-asian-wide.ts',
  };
  if (human) {
    printHuman(run, result.sources, result.groups);
  } else {
    emit('run', run);
    for (const source of result.sources) emit('source', source);
    for (const group of result.groups) emit('group', group);
    emit('summary', {
      codePoints: directionTotals(result.groups, 'code-point'),
      clusters: directionTotals(result.groups, 'cluster'),
    });
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ kind: 'unicode.width-report.error', message })}\n`);
  process.exitCode = 1;
}
