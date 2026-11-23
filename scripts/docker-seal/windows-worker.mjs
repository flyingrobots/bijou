/**
 * PowerShell that prepares a started worker: its source, temporary and home
 * directories, writable by the unprivileged container user.
 */
export const prepareWorkerProgram = "$ErrorActionPreference='Stop'; New-Item -ItemType Directory -Force C:\\work\\source,C:\\temp,C:\\home | Out-Null; foreach($path in @('C:\\work','C:\\temp','C:\\home')) { icacls $path /grant '*S-1-5-32-545:(OI)(CI)M'; if($LASTEXITCODE -ne 0) { throw 'Permission setup failed' } }";

/**
 * PowerShell that gives the copied source root to the unprivileged container
 * user and verifies the owner. Git refuses a worktree root that another
 * account owns. The worker cannot map the account's bare name, so the program
 * names it by its well-known identifier, S-1-5-93-2-2.
 */
export const assignSourceOwnerProgram = "$ErrorActionPreference='Stop'; icacls C:\\work\\source /setowner '*S-1-5-93-2-2'; if($LASTEXITCODE -ne 0) { throw 'Source ownership assignment failed' }; $actual=(Get-Acl C:\\work\\source).GetOwner([System.Security.Principal.SecurityIdentifier]).Value; if($actual -ne 'S-1-5-93-2-2') { throw 'Source ownership verification failed' }";
