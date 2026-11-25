import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MARKER } from './constants.mjs';

/**
 * The toolchain Dockerfile: the pinned Node base plus the seal marker, no RUN.
 * `--chmod` keeps the marker readable by the 1000:1000 worker whatever mode the
 * build context gave it.
 */
export function toolchainDockerfile(base) {
  return `FROM ${base}\nCOPY --chmod=0444 marker /etc/bijou-test-seal\nUSER 1000:1000\nWORKDIR /work/source\nENV HOME=/home/test TMPDIR=/tmp LANG=C.UTF-8 GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null\nCMD ["sleep", "infinity"]\n`;
}

/**
 * Write the toolchain build context into `dir`. The marker is chmodded after
 * writing because the host umask (027 on some workstations) otherwise reaches
 * the image and the worker cannot read `/etc/bijou-test-seal`.
 */
export function writeToolchainContext(dir, base) {
  writeFileSync(join(dir, 'Dockerfile'), toolchainDockerfile(base));
  const marker = join(dir, 'marker');
  writeFileSync(marker, MARKER);
  chmodSync(marker, 0o444);
}
