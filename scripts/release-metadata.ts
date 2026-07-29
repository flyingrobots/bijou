export type { PackageManifest, PrereleaseMetadata, ReleaseCommandIO, ReleaseCommandOutputs, ReleaseMetadata, StableReleaseMetadata, WorkspacePackage } from './release-metadata.part01.js';
export { parseReleaseTag, readCurrentWorkspaceVersion, readWorkspacePackages, validateReleaseVersion } from './release-metadata.part02.js';
export { formatReleaseOutputs, validateWorkspaceVersion, writeGithubOutput } from './release-metadata.part03.js';
export { runReleaseMetadata } from './release-metadata.part04.js';
import './release-metadata.part04.js';
