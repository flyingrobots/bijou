import { randomUUID } from 'node:crypto';
import { computeStats } from '../../stats.js';
import { SCENARIOS, getScenario } from '../../scenarios/index.js';
import type { AnyScenario } from '../../scenarios/index.js';
import type {
  ChildSample,
  ScenarioReport,
  RunReport,
  RunOptions,
} from './runner-types.js';
import { detectCommit, detectFingerprint, runChild } from './runner-child.js';

export function runBench(options: RunOptions): RunReport {
  const scenarios: readonly AnyScenario[] = options.scenarioIds
    ? options.scenarioIds.map(getScenario)
    : SCENARIOS;

  const fingerprint = detectFingerprint();
  const commit = detectCommit();

  const scenarioReports: ScenarioReport[] = [];

  for (const scenario of scenarios) {
    const warmupFrames =
      options.warmupFramesOverride ?? scenario.defaultWarmupFrames;
    const measureFrames =
      options.measureFramesOverride ?? scenario.defaultMeasureFrames;

    options.onProgress?.({
      kind: 'scenario-start',
      scenario,
      total: options.samples,
    });

    const samples: ChildSample[] = [];
    for (let i = 0; i < options.samples; i++) {
      const sample = runChild(scenario.id, i, warmupFrames, measureFrames);
      samples.push(sample);
      options.onProgress?.({
        kind: 'sample-done',
        scenarioId: scenario.id,
        sampleIndex: i,
        nsPerFrame: sample.nsPerFrame,
      });
    }

    const nsPerFrameStats = computeStats(samples.map((s) => s.nsPerFrame));
    const report: ScenarioReport = {
      scenarioId: scenario.id,
      label: scenario.label,
      tags: scenario.tags,
      columns: scenario.columns,
      rows: scenario.rows,
      warmupFrames,
      measureFrames,
      samples,
      nsPerFrameStats,
    };
    scenarioReports.push(report);
    options.onProgress?.({
      kind: 'scenario-done',
      scenarioId: scenario.id,
      stats: nsPerFrameStats,
    });
  }

  return {
    kind: 'bench.v2',
    runId: randomUUID(),
    generatedAt: new Date().toISOString(),
    commit,
    fingerprint,
    params: {
      samples: options.samples,
      warmupFrames: options.warmupFramesOverride ?? 'scenario-default',
      measureFrames: options.measureFramesOverride ?? 'scenario-default',
    },
    scenarios: scenarioReports,
  };
}
export type {
  ChildSample,
  ScenarioReport,
  RunReport,
  Fingerprint,
  RunOptions,
  ProgressEvent,
} from './runner-types.js';
