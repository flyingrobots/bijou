import { join } from 'node:path';

/**
 * Windows tar.exe filters bzip2 through an external program and deadlocks on
 * the pipe, so decompress first and give tar a plain archive.
 */
export function gitExtractionCommands(scratch, target) {
  return [
    { label: 'decompress-git', argv: ['bzip2', '-d', join(scratch, 'git.tar.bz2')], timeout: 300000 },
    { label: 'extract-git', argv: ['tar.exe', '-xf', join(scratch, 'git.tar'), '-C', target], timeout: 300000 },
  ];
}
