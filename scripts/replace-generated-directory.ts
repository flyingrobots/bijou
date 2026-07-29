import {
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';

export function replaceGeneratedDirectory(
  stage: string,
  output: string,
  backup: string,
): void {
  rmSync(backup, { force: true, recursive: true });
  let movedExisting = false;
  let installedStage = false;
  try {
    if (existsSync(output)) {
      renameSync(output, backup);
      movedExisting = true;
    }
    renameSync(stage, output);
    installedStage = true;
    rmSync(backup, { force: true, recursive: true });
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
