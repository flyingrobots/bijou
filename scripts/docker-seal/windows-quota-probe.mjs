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
      .then((output) => output.trim().split(/\s*\r?\n\s*/u).join(' | '), (error) => `probe failed: ${error instanceof Error ? error.message : String(error)}`);
    lines.push(`quota probe as ${user}: ${report}`);
  }
  return lines.join('\n');
}

/**
 * PowerShell for the host that reports, in one line, how the host answers the
 * same 4 GiB quota change on the worker's volume and which entries it can read.
 */
export function hostQuotaProbeProgram(volume) {
  if (!/^\\\\\?\\Volume\{[0-9a-f-]{36}\}\\$/iu.test(volume)) throw new Error('Host quota probe needs a volume GUID path');
  return `${hostProbeHead}${volume}${hostProbeTail}`;
}
const hostProbeHead = "$ErrorActionPreference='Continue'; $volume='";
const hostProbeTail = "'; Write-Host \"host-user=$(whoami)\"; try { $name=(New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-93-2-2').Translate([System.Security.Principal.NTAccount]).Value; Write-Host \"account=$name\" } catch { $name='User Manager\\ContainerUser'; Write-Host \"account-error=$($_.Exception.Message)\" }; try { $q=New-Object -ComObject Microsoft.DiskQuota.1; $q.Initialize($volume, $false); Write-Host \"api-read=ok state=$($q.QuotaState)\"; $count=0; foreach($entry in $q) { if($count -lt 8) { Write-Host \"entry=$($entry.LogonName) used=$([long]$entry.QuotaUsed) limit=$([long]$entry.QuotaLimit)\" }; $count++ }; Write-Host \"entries=$count\" } catch { Write-Host \"api-read-error=$($_.Exception.Message)\" }; try { $w=New-Object -ComObject Microsoft.DiskQuota.1; $w.Initialize($volume, $true); Write-Host 'api-write-open=ok'; $u=$w.AddUser($name); Write-Host 'api-add=ok'; $u.QuotaThreshold=4227858432; $u.QuotaLimit=4294967296; Write-Host \"api-limit=$([long]$u.QuotaLimit)\" } catch { Write-Host \"api-write-error=$($_.Exception.Message)\" }; $out=(fsutil quota query $volume 2>&1 | Out-String).Trim() -replace '\\s+', ' '; Write-Host \"fsutil-query=$LASTEXITCODE $($out.Substring(0, [Math]::Min(600, $out.Length)))\"; Write-Host 'probe=complete'";

/** Run the host probe and return its report line. */
export async function probeHostQuota(volume, run) {
  const report = await Promise.resolve().then(() => run(hostQuotaProbeProgram(volume)))
    .then((output) => output.trim().split(/\s*\r?\n\s*/u).join(' | '), (error) => `probe failed: ${error instanceof Error ? error.message : String(error)}`);
  return `quota probe on the host: ${report}`;
}

/**
 * Run the worker probe in a separate, Hyper-V isolated container and return
 * its report line. It answers whether that isolation can set the quota; the
 * sealed worker itself stays process-isolated.
 */
export async function probeHyperVQuota(run) {
  const report = await Promise.resolve().then(() => run(hyperVQuotaProbeProgram))
    .then((output) => output.trim().split(/\s*\r?\n\s*/u).join(' | '), (error) => `probe failed: ${error instanceof Error ? error.message : String(error)}`);
  return `quota probe in a Hyper-V worker: ${report}`;
}

/** The worker probe, after it turns quota enforcement on for the new container's volume. */
export const hyperVQuotaProbeProgram = `$out=(fsutil quota enforce C: 2>&1 | Out-String).Trim(); Write-Host "fsutil-enforce=$LASTEXITCODE $out"; ${quotaProbeProgram}`;
