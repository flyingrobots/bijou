/**
 * PowerShell that prepares a started worker: its source, temporary and home
 * directories, writable by the unprivileged container user.
 */
export const prepareWorkerProgram = "$ErrorActionPreference='Stop'; New-Item -ItemType Directory -Force C:\\work\\source,C:\\temp,C:\\home | Out-Null; foreach($path in @('C:\\work','C:\\temp','C:\\home')) { icacls $path /grant '*S-1-5-32-545:(OI)(CI)M'; if($LASTEXITCODE -ne 0) { throw 'Permission setup failed' } }";
