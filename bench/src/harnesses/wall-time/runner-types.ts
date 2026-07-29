import type { SampleStats } from '../../stats.js';
import type { AnyScenario } from '../../scenarios/index.js';

export interface ChildSample {
  readonly scenarioId: string;
  readonly sampleIndex: number;
  readonly elapsedNs: number;
  readonly frames: number;
  readonly nsPerFrame: number;
}

export interface ScenarioReport {
  readonly scenarioId: string;
  readonly label: string;
  readonly tags: readonly string[];
  readonly columns: number;
  readonly rows: number;
  readonly warmupFrames: number;
  readonly measureFrames: number;
  readonly samples: readonly ChildSample[];
  readonly nsPerFrameStats: SampleStats;
}

export interface RunReport {
  readonly kind: 'bench.v2';
  readonly runId: string;
  readonly generatedAt: string;
  readonly commit: string | null;
  readonly fingerprint: Fingerprint;
  readonly params: {
    readonly samples: number;
    readonly warmupFrames: number | 'scenario-default';
    readonly measureFrames: number | 'scenario-default';
  };
  readonly scenarios: readonly ScenarioReport[];
}

export interface Fingerprint {
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly release: string;
  readonly nodeVersion: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly totalMemoryBytes: number;
  readonly hostname: string;
}

export interface RunOptions {
  readonly samples: number;
  readonly scenarioIds?: readonly string[];
  readonly warmupFramesOverride?: number;
  readonly measureFramesOverride?: number;
  readonly onProgress?: (event: ProgressEvent) => void;
}

export type ProgressEvent =
  | {
      readonly kind: 'scenario-start';
      readonly scenario: AnyScenario;
      readonly total: number;
    }
  | {
      readonly kind: 'sample-done';
      readonly scenarioId: string;
      readonly sampleIndex: number;
      readonly nsPerFrame: number;
    }
  | {
      readonly kind: 'scenario-done';
      readonly scenarioId: string;
      readonly stats: SampleStats;
    };
