const GiB = 1024 ** 3;
function bytes(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Missing or invalid Windows ${label} measurement`);
  return value;
}
/** The two sampled observations since the baseline, validated and not charged. */
export function windowsUsageGrowth(current, baseline, backingGrowth) {
  if (bytes(current.capacityBytes, 'worker capacity') !== bytes(baseline.capacityBytes, 'baseline capacity')) {
    throw new Error('Windows worker storage capacity changed');
  }
  // A smaller worker volume must never cancel backing growth.
  const volumeGrowth = Math.max(0, bytes(current.usedBytes, 'worker used space') - bytes(baseline.usedBytes, 'baseline used space'));
  return { volumeGrowth, backingGrowth: bytes(backingGrowth, 'backing growth') };
}
/**
 * Charge the larger of two sampled observations since the baseline: growth of
 * used space on the worker volume, and backing growth, which also covers
 * metadata. Neither can show what happened between two samples.
 */
export function validateWindowsUsage(current, baseline, backingGrowth, limit, budget) {
  if (typeof budget !== 'string' || !budget) throw new Error('Windows usage budget must be named');
  bytes(current.backingFree, 'backing free');
  if (current.backingFree < 50 * GiB) throw new Error('Windows Docker backing free-space floor reached');
  const { volumeGrowth: growth } = windowsUsageGrowth(current, baseline, backingGrowth);
  const measured = Math.max(growth, backingGrowth);
  if (measured > bytes(limit, 'usage limit')) {
    throw new Error(`Windows writable-layer allowance exhausted: ${budget} budget is ${String(limit)} bytes; `
      + `observed worker volume growth of ${String(growth)} bytes and backing growth of ${String(backingGrowth)} bytes`);
  }
  return measured;
}
