#!/usr/bin/env node

import { PerformanceObserver } from 'node:perf_hooks';

interface SampleResult {
  readonly index: number;
  readonly heapDelta: number;
  readonly gcEvents: number;
}

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function allocateHeapSample(allocationCount: number, arraySize: number): void {
  const chunks: number[][] = [];
  for (let i = 0; i < allocationCount; i++) {
    chunks.push(new Array(arraySize).fill(i));
  }
  void chunks;
}

function main(): void {
  if (typeof global.gc !== 'function') {
    console.error('gc-observer-repro: run with --expose-gc');
    process.exitCode = 1;
    return;
  }

  const samples = readIntEnv('BIJOU_GC_REPRO_SAMPLES', 20);
  const allocationCount = readIntEnv('BIJOU_GC_REPRO_ALLOCATION_COUNT', 64);
  const arraySize = readIntEnv('BIJOU_GC_REPRO_ARRAY_SIZE', 16_384);

  let callbackEvents = 0;
  const observer = new PerformanceObserver((list) => {
    callbackEvents += list.getEntries().length;
  });
  observer.observe({ entryTypes: ['gc'] });

  const results: SampleResult[] = [];
  for (let index = 0; index < samples; index++) {
    global.gc();
    const before = process.memoryUsage().heapUsed;

    allocateHeapSample(allocationCount, arraySize);

    const after = process.memoryUsage().heapUsed;
    const takeRecordsEvents = observer.takeRecords().length;
    results.push({
      index,
      heapDelta: after - before,
      gcEvents: takeRecordsEvents,
    });
  }

  observer.disconnect();

  const suspicious = results.filter((sample) => sample.heapDelta < 0 && sample.gcEvents === 0);
  const negativeDeltas = results.filter((sample) => sample.heapDelta < 0).length;
  const summary = {
    samples,
    allocationCount,
    arraySize,
    callbackEvents,
    takeRecordsEvents: results.reduce((sum, sample) => sum + sample.gcEvents, 0),
    negativeHeapDeltas: negativeDeltas,
    suspiciousSamples: suspicious.length,
  };

  process.stdout.write(`${JSON.stringify({ summary, results }, null, 2)}\n`);
}

main();
