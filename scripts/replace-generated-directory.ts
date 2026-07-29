import {
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';

export function replaceGeneratedDirectory(
  stage: string,
  output: string,
  backup: string,
  cleanupBackup: (path: string) => void = removeDirectory,
): void {
  if (existsSync(backup)) {
    throw new Error(
      `Refusing to overwrite existing backup at ${backup}; `
      + 'resolve or recover it before retrying',
    );
  }
  let movedExisting = false;
  let installedStage = false;
  try {
    if (existsSync(output)) {
      renameSync(output, backup);
      movedExisting = true;
    }
    renameSync(stage, output);
    installedStage = true;
    try {
      cleanupBackup(backup);
    } catch {
      // Installation succeeded. Leave any remaining backup for inspection.
    }
  } catch (error) {
    if (movedExisting && !installedStage && !existsSync(output)) {
      try {
        renameSync(backup, output);
      } catch (restoreError) {
        rmSync(stage, { force: true, recursive: true });
        throw new AggregateError(
          [error, restoreError],
          `Generated output restore failed; backup remains at ${backup}`,
          { cause: restoreError },
        );
      }
    }
    rmSync(stage, { force: true, recursive: true });
    throw error;
  }
}

function removeDirectory(path: string): void {
  rmSync(path, { force: true, recursive: true });
}
