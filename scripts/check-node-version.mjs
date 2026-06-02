import { pathToFileURL } from 'node:url';

const MINIMUM_NODE_20_MINOR = 19;
const MINIMUM_NODE_22_MINOR = 12;

export function parseNodeMajor(version) {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  const [majorText] = normalized.split('.');
  const major = Number(majorText);
  return Number.isInteger(major) ? major : undefined;
}

function parseNodeVersion(version) {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  const [majorText, minorText = '0'] = normalized.split('.');
  const major = Number(majorText);
  const minor = Number(minorText);
  if (!Number.isInteger(major) || !Number.isInteger(minor)) {
    return undefined;
  }
  return { major, minor };
}

export function isSupportedNodeVersion(version) {
  const parsed = parseNodeVersion(version);
  if (parsed === undefined) {
    return false;
  }
  if (parsed.major === 20) {
    return parsed.minor >= MINIMUM_NODE_20_MINOR;
  }
  if (parsed.major === 22) {
    return parsed.minor >= MINIMUM_NODE_22_MINOR;
  }
  return parsed.major > 22;
}

export function unsupportedNodeMessage(version) {
  return `Unsupported Node.js ${version}; use Node.js 20.19 or newer, or Node.js 22.12 or newer.`;
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
