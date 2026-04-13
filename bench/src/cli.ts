/**
 * Bijou bench CLI — dispatches to harnesses.
 *
 * Subcommands:
 *   run       — wall-time bench. Spawns N children per scenario,
 *               aggregates stats, optionally writes a structured report.
 *   compare   — diff two bench reports (nested JSON or flat JSONL).
 *   list      — print the scenario registry with IDs and labels.
 *
 * Usage:
 *   node --import tsx bench/src/cli.ts run [--scenario=ID] [--samples=30]
 *                                          [--warmup=N] [--frames=N] [--format=summary|json|jsonl]
 *                                          [--out=path.json]
 *   node --import tsx bench/src/cli.ts compare <baseline.json> <current.json>
 *   node --import tsx bench/src/cli.ts list
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import {
  listScenarioIds,
  parseScenarioTagGroup,
  selectScenarios,
  type ScenarioTagGroup,
} from './scenarios/index.js';
import { formatReportAsJsonl } from './harnesses/wall-time/format-jsonl.js';
import { readBenchReport } from './harnesses/wall-time/read-report.js';
import { runBench, type RunReport } from './harnesses/wall-time/runner.js';
import { compareReports, formatComparison } from './harnesses/wall-time/compare.js';
import { formatNs } from './stats.js';

type BenchOutputFormat = 'summary' | 'json' | 'jsonl';

/**
 * Parse `--key=value`, `--key value`, and bare `--flag` forms.
 * Unknown positional args are returned from `positional()` below.
 */
function parseKv(argv: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      out.set(arg.slice(2, eq), arg.slice(eq + 1));
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next != null && !next.startsWith('--')) {
      out.set(key, next);
      i++; // consume the value
    } else {
      out.set(key, 'true');
    }
  }
  return out;
}

function flagValues(argv: readonly string[], key: string): string[] {
  const values: string[] = [];
  const longFlag = `--${key}`;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === longFlag) {
      const next = argv[i + 1];
      if (next != null && !next.startsWith('--')) {
        values.push(next);
        i++;
      }
      continue;
    }
    if (arg.startsWith(`${longFlag}=`)) {
      values.push(arg.slice(longFlag.length + 1));
    }
  }

  return values;
}

function parseTagGroups(argv: readonly string[]): readonly ScenarioTagGroup[] {
  return flagValues(argv, 'tag').map(parseScenarioTagGroup);
}

function formatTagGroups(tagGroups: readonly ScenarioTagGroup[]): string {
  return tagGroups.map((group) => group.join('+')).join('|');
}

function parseOutputFormat(value: string | undefined): BenchOutputFormat {
  if (value == null || value === 'summary') return 'summary';
  if (value === 'json') return 'json';
  if (value === 'jsonl' || value === 'flat') return 'jsonl';
  throw new Error(`invalid --format: ${value} (expected summary, json, or jsonl)`);
}

function fileFormatForOutput(format: BenchOutputFormat): Exclude<BenchOutputFormat, 'summary'> {
  return format === 'summary' ? 'json' : format;
}

function defaultOutExtension(format: Exclude<BenchOutputFormat, 'summary'>): string {
  return format === 'jsonl' ? 'jsonl' : 'json';
}

function renderStructuredReport(report: RunReport, format: Exclude<BenchOutputFormat, 'summary'>): string {
  return format === 'json'
    ? JSON.stringify(report, null, 2) + '\n'
    : formatReportAsJsonl(report);
}

function positional(argv: readonly string[]): string[] {
  // Positionals are non-flag args that are not consumed as values for
  // preceding `--key value` flags. We walk the argv mirroring parseKv's
  // consumption so positionals are identified correctly.
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith('--')) {
      result.push(arg);
      continue;
    }
    if (arg.includes('=')) continue;
    // Bare --flag: if the next arg is a value (not another flag),
    // skip it as parseKv consumed it.
    const next = argv[i + 1];
    if (next != null && !next.startsWith('--')) {
      i++; // skip value
    }
  }
  return result;
}

function cmdList(argv: readonly string[]): void {
  const tagGroups = parseTagGroups(argv);
  const scenarios = selectScenarios({ tagGroups });

  process.stdout.write(tagGroups.length > 0
    ? `scenarios (tags: ${formatTagGroups(tagGroups)}):\n`
    : 'scenarios:\n');
  for (const s of scenarios) {
    process.stdout.write(`  ${s.id}\n`);
    process.stdout.write(`    ${s.label}\n`);
    process.stdout.write(`    tags: ${s.tags.join(', ')}\n`);
    process.stdout.write(`    ${s.columns}×${s.rows}, warmup=${s.defaultWarmupFrames}, measure=${s.defaultMeasureFrames}\n`);
    process.stdout.write(`    ${s.description}\n`);
    process.stdout.write('\n');
  }
}

function cmdRun(argv: readonly string[]): void {
  const kv = parseKv(argv);

  const samples = Number.parseInt(kv.get('samples') ?? '30', 10);
  if (!Number.isFinite(samples) || samples <= 0) {
    throw new Error(`invalid --samples: ${kv.get('samples')}`);
  }

  const warmupOverride = kv.get('warmup');
  const framesOverride = kv.get('frames');
  const scenarioArg = kv.get('scenario');
  const outArg = kv.get('out');
  const format = parseOutputFormat(kv.get('format'));
  const tagGroups = parseTagGroups(argv);

  const requestedScenarioIds =
    scenarioArg && scenarioArg !== 'all'
      ? scenarioArg.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : undefined;
  const scenarioIds = selectScenarios({
    ...(requestedScenarioIds != null ? { ids: requestedScenarioIds } : {}),
    ...(tagGroups.length > 0 ? { tagGroups } : {}),
  }).map((scenario) => scenario.id);

  process.stderr.write(
    `bench: scenarios=${scenarioIds.join(',')}, tags=${tagGroups.length > 0 ? formatTagGroups(tagGroups) : 'none'}, samples=${samples}, warmup=${warmupOverride ?? 'default'}, frames=${framesOverride ?? 'default'}\n`,
  );

  const report = runBench({
    samples,
    scenarioIds,
    ...(warmupOverride != null ? { warmupFramesOverride: Number.parseInt(warmupOverride, 10) } : {}),
    ...(framesOverride != null ? { measureFramesOverride: Number.parseInt(framesOverride, 10) } : {}),
    onProgress: (event) => {
      if (event.kind === 'scenario-start') {
        process.stderr.write(`  ${event.scenario.id}: ${event.total} samples... `);
      } else if (event.kind === 'scenario-done') {
        const { p50, cov } = event.stats;
        process.stderr.write(`done. p50=${formatNs(p50)}, CoV=${(cov * 100).toFixed(1)}%\n`);
      }
    },
  });

  if (format === 'summary') {
    printSummary(report);
  } else {
    process.stdout.write(renderStructuredReport(report, format));
  }

  if (outArg != null) {
    const outFormat = fileFormatForOutput(format);
    let outPath = resolve(process.cwd(), outArg);
    // If the user gave a directory, auto-name the file.
    try {
      const stat = statSync(outPath);
      if (stat.isDirectory()) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const commit = report.commit ?? 'unknown';
        outPath = join(outPath, `bench-${stamp}-${commit}.${defaultOutExtension(outFormat)}`);
      }
    } catch {
      // doesn't exist — assume it's a file path
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, renderStructuredReport(report, outFormat), 'utf8');
    process.stderr.write(`\nsaved: ${outPath}\n`);
  }
}

function printSummary(report: RunReport): void {
  process.stdout.write(`\nbench.v2 — ${report.scenarios.length} scenarios, ${report.params.samples} samples each\n`);
  process.stdout.write(`commit: ${report.commit ?? 'unknown'}\n`);
  process.stdout.write(`machine: ${report.fingerprint.cpuModel} (${report.fingerprint.arch}, ${report.fingerprint.cpuCount} cores), Node ${report.fingerprint.nodeVersion}\n\n`);
  process.stdout.write('| Scenario | P50 | P90 | P99 | Min | Max | CoV |\n');
  process.stdout.write('|---|---|---|---|---|---|---|\n');
  for (const s of report.scenarios) {
    const st = s.nsPerFrameStats;
    process.stdout.write(
      `| ${s.scenarioId} | ${formatNs(st.p50)} | ${formatNs(st.p90)} | ${formatNs(st.p99)} | ${formatNs(st.min)} | ${formatNs(st.max)} | ${(st.cov * 100).toFixed(1)}% |\n`,
    );
  }
  process.stdout.write('\n');
}

function cmdCompare(argv: readonly string[]): void {
  const positionals = positional(argv);
  if (positionals.length < 2) {
    throw new Error('usage: bench compare <baseline.json> <current.json>');
  }
  const baselinePath = resolve(process.cwd(), positionals[0]!);
  const currentPath = resolve(process.cwd(), positionals[1]!);
  const baseline = readBenchReport(baselinePath);
  const current = readBenchReport(currentPath);
  const comparison = compareReports(baseline, current);
  process.stdout.write(formatComparison(comparison) + '\n');
}

function main(): void {
  const argv = process.argv.slice(2);
  const [subcommand, ...rest] = argv;

  if (subcommand == null || subcommand === '--help' || subcommand === '-h') {
    process.stdout.write(
      [
        'bijou-bench — performance harness',
        '',
        'usage:',
        '  bench run [--scenario=ID|all] [--tag=TAG[,TAG]] [--samples=30] [--warmup=N] [--frames=N] [--format=summary|json|jsonl] [--out=path]',
        '  bench compare <baseline.json> <current.json>',
        '  bench list [--tag=TAG[,TAG]]',
        '',
        'Formats: summary=human table (default), json=nested bench.v2, jsonl=flat metric records.',
        'Tag filters: comma-separated tags are AND within one --tag, repeated --tag flags are OR across groups.',
        `scenarios: ${listScenarioIds().join(', ')}`,
      ].join('\n') + '\n',
    );
    return;
  }

  switch (subcommand) {
    case 'run':
      cmdRun(rest);
      break;
    case 'compare':
      cmdCompare(rest);
      break;
    case 'list':
      cmdList(rest);
      break;
    default:
      throw new Error(`unknown subcommand: ${subcommand}`);
  }
}

main();
