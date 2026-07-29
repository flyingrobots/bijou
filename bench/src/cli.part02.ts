import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { selectScenarios } from './scenarios/index.js';
import { runBench, type RunReport } from './harnesses/wall-time/runner.js';
import { formatNs } from './stats.js';
import {
  defaultOutExtension,
  fileFormatForOutput,
  formatTagGroups,
  parseKv,
  parseOutputFormat,
  parseTagGroups,
  renderStructuredReport,
} from './cli.part01.js';

export function cmdList(argv: readonly string[]): void {
  const tagGroups = parseTagGroups(argv);
  const scenarios = selectScenarios({ tagGroups });

  process.stdout.write(
    tagGroups.length > 0
      ? `scenarios (tags: ${formatTagGroups(tagGroups)}):\n`
      : 'scenarios:\n',
  );
  for (const s of scenarios) {
    process.stdout.write(`  ${s.id}\n`);
    process.stdout.write(`    ${s.label}\n`);
    process.stdout.write(`    tags: ${s.tags.join(', ')}\n`);
    process.stdout.write(
      `    ${String(s.columns)}×${String(s.rows)}, warmup=${String(s.defaultWarmupFrames)}, measure=${String(s.defaultMeasureFrames)}\n`,
    );
    process.stdout.write(`    ${s.description}\n`);
    process.stdout.write('\n');
  }
}
export function cmdRun(argv: readonly string[]): void {
  const kv = parseKv(argv);

  const rawSamples = kv.get('samples') ?? '30';
  const samples = Number.parseInt(rawSamples, 10);
  if (!Number.isFinite(samples) || samples <= 0) {
    throw new Error(`invalid --samples: ${rawSamples}`);
  }

  const warmupOverride = kv.get('warmup');
  const framesOverride = kv.get('frames');
  const scenarioArg = kv.get('scenario');
  const outArg = kv.get('out');
  const format = parseOutputFormat(kv.get('format'));
  const tagGroups = parseTagGroups(argv);

  const requestedScenarioIds =
    scenarioArg && scenarioArg !== 'all'
      ? scenarioArg
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : undefined;
  const scenarioIds = selectScenarios({
    ...(requestedScenarioIds != null ? { ids: requestedScenarioIds } : {}),
    ...(tagGroups.length > 0 ? { tagGroups } : {}),
  }).map((scenario) => scenario.id);

  process.stderr.write(
    `bench: scenarios=${scenarioIds.join(',')}, tags=${tagGroups.length > 0 ? formatTagGroups(tagGroups) : 'none'}, samples=${String(samples)}, warmup=${warmupOverride ?? 'default'}, frames=${framesOverride ?? 'default'}\n`,
  );

  const report = runBench({
    samples,
    scenarioIds,
    ...(warmupOverride != null
      ? { warmupFramesOverride: Number.parseInt(warmupOverride, 10) }
      : {}),
    ...(framesOverride != null
      ? { measureFramesOverride: Number.parseInt(framesOverride, 10) }
      : {}),
    onProgress: (event) => {
      if (event.kind === 'scenario-start') {
        process.stderr.write(
          `  ${event.scenario.id}: ${String(event.total)} samples... `,
        );
      } else if (event.kind === 'scenario-done') {
        const { p50, cov } = event.stats;
        process.stderr.write(
          `done. p50=${formatNs(p50)}, CoV=${(cov * 100).toFixed(1)}%\n`,
        );
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
        outPath = join(
          outPath,
          `bench-${stamp}-${commit}.${defaultOutExtension(outFormat)}`,
        );
      }
    } catch {
      // doesn't exist — assume it's a file path
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, renderStructuredReport(report, outFormat), 'utf8');
    process.stderr.write(`\nsaved: ${outPath}\n`);
  }
}
export function printSummary(report: RunReport): void {
  process.stdout.write(
    `\nbench.v2 — ${String(report.scenarios.length)} scenarios, ${String(report.params.samples)} samples each\n`,
  );
  process.stdout.write(`commit: ${report.commit ?? 'unknown'}\n`);
  process.stdout.write(
    `machine: ${report.fingerprint.cpuModel} (${report.fingerprint.arch}, ${String(report.fingerprint.cpuCount)} cores), Node ${report.fingerprint.nodeVersion}\n\n`,
  );
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
