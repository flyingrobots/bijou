import { PerformanceObserver } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { raytraceAdd, raytraceScale, type RaytraceVector3, type RaytraceVector3Mutable } from './raytrace.js';

const ITERATIONS = 3_000_000;

async function gcCount(work: () => void): Promise<number> {
  let count = 0;
  const observer = new PerformanceObserver((list) => {
    count += list.getEntries().length;
  });
  observer.observe({ entryTypes: ['gc'] });
  work();
  await new Promise((resolve) => setTimeout(resolve, 50));
  observer.disconnect();
  return count;
}

describe('raytrace target helpers allocate nothing per call', () => {
  it('triggers no garbage collection over millions of calls, unlike the allocating form', async () => {
    const a: RaytraceVector3 = [1, 2, 3];
    const b: RaytraceVector3 = [4, 5, 6];
    const out: RaytraceVector3Mutable = [0, 0, 0];
    const sink: RaytraceVector3[] = new Array<RaytraceVector3>(256);

    const allocating = await gcCount(() => {
      for (let i = 0; i < ITERATIONS; i++) sink[i & 255] = raytraceScale(raytraceAdd(a, b), 0.5);
    });
    const withTarget = await gcCount(() => {
      for (let i = 0; i < ITERATIONS; i++) raytraceScale(raytraceAdd(a, b, out), 0.5, out);
    });

    expect(allocating, 'control: the allocating form must provoke GC').toBeGreaterThan(0);
    expect(withTarget).toBe(0);
  });
});
