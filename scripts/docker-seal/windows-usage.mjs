const GiB = 1024 ** 3;
function bytes(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Missing or invalid Windows ${label} measurement`);
  return value;
}
/** Quota records cover every owner and stream; backing growth also covers metadata. */
export function validateWindowsUsage(current, baseline, backingGrowth, limit) {
  bytes(current.backingFree, 'backing free');
  if (current.backingFree < 50 * GiB) throw new Error('Windows Docker backing free-space floor reached');
  if (!current.owners || !Object.keys(current.owners).length) throw new Error('Windows quota accounting is unavailable');
  if (!baseline.owners || !Object.keys(baseline.owners).length) throw new Error('Windows quota baseline is unavailable');
  for (const sid of Object.keys(baseline.owners)) {
    if (!Object.hasOwn(current.owners, sid)) throw new Error('Windows quota owner measurement is incomplete');
  }
  let growth = 0;
  for (const [sid, used] of Object.entries(current.owners)) {
    if (!/^S-1-/u.test(sid)) throw new Error('Windows quota owner is not a SID');
    const before = baseline.owners[sid] ?? 0;
    // A shrink or ownership transfer must never cancel another owner's growth.
    growth += Math.max(0, bytes(used, 'owner usage') - bytes(before, 'baseline owner usage'));
  }
  const measured = Math.max(growth, bytes(backingGrowth, 'backing growth'));
  if (measured > bytes(limit, 'usage limit')) throw new Error('Windows writable-layer allowance exhausted');
  return measured;
}
