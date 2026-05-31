import { pathToFileURL } from 'node:url';

const SUPPORTED_NODE_MAJORS = Object.freeze([18, 20, 22]);

export function parseNodeMajor(version) {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  const [majorText] = normalized.split('.');
  const major = Number(majorText);
  return Number.isInteger(major) ? major : undefined;
}

export function isSupportedNodeVersion(version) {
  const major = parseNodeMajor(version);
  return major !== undefined && SUPPORTED_NODE_MAJORS.includes(major);
}

export function unsupportedNodeMessage(version) {
  return `Unsupported Node.js ${version}; use LTS releases 18, 20, or 22.`;
}

export function checkNodeVersion(version = process.version) {
  if (isSupportedNodeVersion(version)) {
    return { ok: true };
  }
  return {
    ok: false,
    message: unsupportedNodeMessage(version),
  };
}

export function main(argv = process.argv, stderr = process.stderr) {
  const version = argv[2] === '--version' ? argv[3] : process.version;
  const result = checkNodeVersion(version ?? process.version);
  if (!result.ok) {
    stderr.write(`${result.message}\n`);
    return 1;
  }
  return 0;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
