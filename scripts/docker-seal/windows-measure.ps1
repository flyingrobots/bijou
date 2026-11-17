param([switch]$Initialize, [string]$ExpectedVolume)
$ErrorActionPreference = 'Stop'
$volumeIdentity = @(Get-CimInstance -ClassName Win32_Volume -Filter "DriveLetter='C:'")
if ($volumeIdentity.Count -ne 1 -or $volumeIdentity[0].DeviceID -ne $ExpectedVolume) {
  throw 'Container quota volume identity changed or is unavailable'
}
# The worker cannot map the bare account name to a security identifier, so
# ask Windows for the qualified name of the well-known ContainerUser identifier.
$containerUser = (New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-93-2-2').Translate([System.Security.Principal.NTAccount]).Value
if ($containerUser -notmatch '^[^\\]+\\ContainerUser$') { throw "ContainerUser account unavailable: $($containerUser)" }
# NTFS charges all data streams to their owner, independently of path. Query
# every owner so Administrator/System-owned writable files cannot escape.
# https://learn.microsoft.com/windows/win32/fileio/disk-quota-limits
if ($Initialize) {
  $output = fsutil quota enforce C: 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Native NTFS quota enforcement unavailable: $($output)" }
  $output = fsutil quota modify C: 4227858432 4294967296 $containerUser 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "ContainerUser hard quota unavailable: $($output)" }
}
$volume = New-Object -ComObject Microsoft.DiskQuota.1
$volume.Initialize('C:\', $false)
if ($volume.QuotaState -ne 2 -or $volume.QuotaFileIncomplete -or $volume.QuotaFileRebuilding) {
  throw 'Native NTFS quota accounting is incomplete or unenforced'
}
$user = $volume.FindUser($containerUser)
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
