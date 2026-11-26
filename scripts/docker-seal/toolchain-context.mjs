import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MARKER } from './constants.mjs';

/**
 * The toolchain Dockerfile: the pinned Node base plus the seal marker, no RUN.
 * COPY keeps the mode the build context gives the marker (0444, see below) with
 * both the legacy builder and BuildKit, so no `--chmod` (BuildKit only) is needed.
 */
export function toolchainDockerfile(base) {
  return `FROM ${base}\nCOPY marker /etc/bijou-test-seal\nUSER 1000:1000\nWORKDIR /work/source\nENV HOME=/home/test TMPDIR=/tmp LANG=C.UTF-8 GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null\nCMD ["sleep", "infinity"]\n`;
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
