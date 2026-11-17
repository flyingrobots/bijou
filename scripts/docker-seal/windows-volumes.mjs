const ps = ['powershell', '-NoLogo', '-NoProfile', '-NonInteractive', '-Command'];

/**
 * List every host volume, so a container quota volume can be proved independent
 * of them. Hosted runners need more than 15 seconds for the query.
 */
export const hostVolumeInventory = Object.freeze({
  label: 'host-volumes',
  argv: Object.freeze([...ps,
    "$ErrorActionPreference='Stop'; ConvertTo-Json -InputObject @((Get-CimInstance -ClassName Win32_Volume).DeviceID) -Compress"]),
  timeout: 60000,
});

/** Validate the inventory output and normalize the identifiers for comparison. */
export function parseHostVolumes(output) {
  const volumes = JSON.parse(output);
  if (!Array.isArray(volumes) || !volumes.length || volumes.some((value) => typeof value !== 'string')) throw new Error('Host volume inventory unavailable');
  return volumes.map((value) => value.toLowerCase());
}

const refusal = 'Independent container quota volume cannot be established';

/**
 * Accept the worker's volume query only as one volume GUID path that the host
 * inventory does not contain, so the quota lands on a volume the container owns.
 */
export function parseContainerVolume(output, hostVolumes) {
  const volumes = JSON.parse(output);
  if (!Array.isArray(volumes) || volumes.length !== 1) throw new Error(`${refusal}: expected one volume, got ${output.trim().slice(0, 500)}`);
  const [volume] = volumes;
  if (typeof volume !== 'string' || !/^\\\\\?\\Volume\{[0-9a-f-]{36}\}\\$/iu.test(volume)) throw new Error(`${refusal}: not a volume GUID path: ${JSON.stringify(volume)}`);
  if (hostVolumes.includes(volume.toLowerCase())) throw new Error(`${refusal}: present on the host: ${volume}`);
  return volume;
}
