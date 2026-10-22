import { BIJOU_VERSION } from './app-ids.js';

const PRERELEASE_SUFFIX = /-(?:alpha|beta|rc)\.\d+$/u;

/**
 * The release *line* a version belongs to: `8.0.0-rc.1` resolves to `8.0.0`.
 *
 * Release docs live under `docs/releases/<line>/`, never
 * `docs/releases/<exact-version>/`. A prerelease is a candidate *for* a line and
 * shares its What's New and migration guide, and `release:readiness` keys the
 * evidence-packet path off the target milestone, which is the line too.
 *
 * Reading the raw version instead meant the docs app threw an unhandled ENOENT
 * at module load for any prerelease — before the first frame — because no
 * `docs/releases/8.0.0-rc.1/` directory exists or should. See #523.
 */
export function releaseLineOf(version: string): string {
  return version.replace(PRERELEASE_SUFFIX, '');
}

/** The release line of the version this build reports. */
export const BIJOU_RELEASE_LINE = releaseLineOf(BIJOU_VERSION);
