// v2: the worker is sized from Docker's capacity (worker-profile.mjs). Branches
// that predate it keep the old fixed-size worker under the old name.
export const WORKER = 'bijou-sealed-tests-v2';
export const OWNER = 'org.bijou.sealed-tests';
export const MARKER = 'bijou-test-seal-v1\n';
export const BASE22 = 'node:22-bookworm@sha256:63538dfe497cc29dfafdda25ada09b46db68a3f4cc205abf1f5d6bf0913f3384';
export const MiB = 1024 ** 2;
export const GiB = 1024 ** 3;
export const LIMITS = Object.freeze({ source: 256 * MiB, pack: 512 * MiB,
  archive: 768 * MiB, stdin: MiB, log: 16 * MiB, retained: 96 * MiB,
  free: 50 * GiB, deadline: 1800_000 });
export function imageName(version) {
  if (!['20', '22', '24'].includes(version)) throw new Error('Only Node 20, 22 or 24 is supported');
  return `bijou-sealed-node${version}:local`;
}
export function cleanEnvironment() {
  return { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8', COPYFILE_DISABLE: '1',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
}
