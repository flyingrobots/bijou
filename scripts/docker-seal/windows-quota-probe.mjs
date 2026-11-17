/** The worker identities that try the quota change when initialization fails. */
export const quotaProbeUsers = Object.freeze(['ContainerAdministrator', 'NT AUTHORITY\\SYSTEM']);

/**
 * PowerShell that reports, in one line, who it runs as and how the worker
 * answers the 4 GiB quota change through fsutil and through the disk quota API.
 */
export const quotaProbeProgram = "$ErrorActionPreference='Continue'; $name=(New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-93-2-2').Translate([System.Security.Principal.NTAccount]).Value; $facts=@(\"user=$(whoami)\", \"account=$name\"); $facts+='privileges='+((whoami /priv /fo csv | ConvertFrom-Csv | Where-Object { $_.State -eq 'Enabled' } | ForEach-Object { $_.'Privilege Name' }) -join ','); $out=(fsutil quota modify C: 4227858432 4294967296 $name 2>&1 | Out-String).Trim(); $facts+=\"fsutil-modify=$LASTEXITCODE $out\"; $out=(fsutil quota query C: 2>&1 | Out-String).Trim(); $facts+=\"fsutil-query=$LASTEXITCODE $($out.Substring(0, [Math]::Min(400, $out.Length)))\"; try { $q=New-Object -ComObject Microsoft.DiskQuota.1; $q.Initialize($env:SystemDrive + [char]92, $true); $facts+=\"api-open=ok state=$($q.QuotaState)\"; $u=$q.AddUser($name); $facts+='api-add=ok'; $u.QuotaThreshold=4227858432; $u.QuotaLimit=4294967296; $facts+=\"api-limit=$([long]$u.QuotaLimit)\" } catch { $facts+=\"api-error=$($_.Exception.Message)\" }; ($facts -join ' | ') -replace '\\s+', ' '";

/** Run the probe as each identity and return one report line for each. */
export async function probeQuota(run) {
  const lines = [];
  for (const user of quotaProbeUsers) {
    const report = await run(user, quotaProbeProgram)
      .then((output) => output.trim(), (error) => `probe failed: ${error instanceof Error ? error.message : String(error)}`);
    lines.push(`quota probe as ${user}: ${report}`);
  }
  return lines.join('\n');
}
