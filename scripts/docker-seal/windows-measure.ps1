param([switch]$Initialize, [string]$ExpectedVolume)
$ErrorActionPreference = 'Stop'
$volumeIdentity = @(Get-CimInstance -ClassName Win32_Volume -Filter "DriveLetter='C:'")
if ($volumeIdentity.Count -ne 1 -or $volumeIdentity[0].DeviceID -ne $ExpectedVolume) {
  throw 'Container quota volume identity changed or is unavailable'
}
# NTFS charges all data streams to their owner, independently of path. Query
# every owner so Administrator/System-owned writable files cannot escape.
# https://learn.microsoft.com/windows/win32/fileio/disk-quota-limits
if ($Initialize) {
  fsutil quota enforce C: | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Native NTFS quota enforcement unavailable' }
  fsutil quota modify C: 4227858432 4294967296 ContainerUser | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'ContainerUser hard quota unavailable' }
}
$volume = New-Object -ComObject Microsoft.DiskQuota.1
$volume.Initialize('C:\', $false)
if ($volume.QuotaState -ne 2 -or $volume.QuotaFileIncomplete -or $volume.QuotaFileRebuilding) {
  throw 'Native NTFS quota accounting is incomplete or unenforced'
}
$user = $volume.FindUser('ContainerUser')
if ($null -eq $user -or [long]$user.QuotaLimit -ne 4294967296) {
  throw 'ContainerUser hard quota changed'
}
$owners = @{}
foreach ($entry in $volume) {
  # DIDiskQuotaUser.ID is process-local, so never use it as a persistent key.
  $account = [System.Security.Principal.NTAccount]$entry.LogonName
  $sid = $account.Translate([System.Security.Principal.SecurityIdentifier]).Value
  if ($owners.ContainsKey($sid)) { throw 'Duplicate quota owner measurement' }
  $entry.Invalidate()
  $used = [long]$entry.QuotaUsed
  if ($used -lt 0) { throw 'Negative quota usage' }
  $owners[$sid] = $used
}
if ($owners.Count -eq 0) { throw 'Native NTFS quota accounting returned no owners' }
@{ owners=$owners; processes=@(Get-Process).Count; userLimit=[long]$user.QuotaLimit; volume=$ExpectedVolume } |
  ConvertTo-Json -Compress -Depth 3
