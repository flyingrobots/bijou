const GiB = 1024 ** 3;
function bytes(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Missing or invalid Windows ${label} measurement`);
  return value;
}
/**
 * Charge the larger of two sampled observations since the baseline: growth of
 * used space on the worker volume, and backing growth, which also covers
 * metadata. Neither can show what happened between two samples.
 */
export function validateWindowsUsage(current, baseline, backingGrowth, limit) {
  bytes(current.backingFree, 'backing free');
  if (current.backingFree < 50 * GiB) throw new Error('Windows Docker backing free-space floor reached');
  if (bytes(current.capacityBytes, 'worker capacity') !== bytes(baseline.capacityBytes, 'baseline capacity')) {
    throw new Error('Windows worker storage capacity changed');
  }
  // A smaller worker volume must never cancel backing growth.
  const growth = Math.max(0, bytes(current.usedBytes, 'worker used space') - bytes(baseline.usedBytes, 'baseline used space'));
  const measured = Math.max(growth, bytes(backingGrowth, 'backing growth'));
  if (measured > bytes(limit, 'usage limit')) throw new Error('Windows writable-layer allowance exhausted');
  return measured;
}
