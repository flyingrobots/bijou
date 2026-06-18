export function isCoreFile(file: string): boolean;

export function findCorePurityFailures(
  files: readonly string[],
  readContent: (file: string) => string,
): string[];
