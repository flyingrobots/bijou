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
