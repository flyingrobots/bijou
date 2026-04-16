#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: npm run version <version>"
  echo "Example: npm run version 0.2.0"
  exit 1
fi

VERSION="$1"

# Validate semver (with optional prerelease)
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-(rc|beta|alpha)\.[0-9]+)?$ ]]; then
  echo "Error: invalid semver: $VERSION"
  echo "Expected: X.Y.Z or X.Y.Z-(rc|beta|alpha).N"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Find all workspace package.json files from the root workspaces config.
mapfile -t PACKAGES < <(node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const rootManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workspaces = Array.isArray(rootManifest.workspaces)
  ? rootManifest.workspaces
  : rootManifest.workspaces?.packages;

if (!Array.isArray(workspaces) || workspaces.length === 0) {
  throw new Error('Root package.json is missing workspaces configuration');
}

const manifestPaths = new Set();

for (const pattern of workspaces) {
  if (pattern.endsWith('/*')) {
    const basePattern = pattern.slice(0, -2);
    if (basePattern.includes('*')) {
      throw new Error(`Unsupported workspace pattern: ${pattern}`);
    }

    const baseDir = path.join(root, basePattern);
    if (!fs.existsSync(baseDir)) {
      throw new Error(`Workspace directory does not exist: ${pattern}`);
    }

    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(baseDir, entry.name, 'package.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Workspace package is missing package.json: ${path.join(basePattern, entry.name)}`);
      }
      manifestPaths.add(manifestPath);
    }
    continue;
  }

  if (pattern.includes('*')) {
    throw new Error(`Unsupported workspace pattern: ${pattern}`);
  }

  const manifestPath = path.join(root, pattern, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Workspace package is missing package.json: ${pattern}`);
  }
  manifestPaths.add(manifestPath);
}

for (const manifestPath of [...manifestPaths].sort()) {
  console.log(manifestPath);
}
NODE
)

echo "Bumping all packages to $VERSION"
echo ""

for pkg in "${PACKAGES[@]}"; do
  name=$(node -p "require('$pkg').name")

  # Set version
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
    p.version = '$VERSION';
    fs.writeFileSync('$pkg', JSON.stringify(p, null, 2) + '\n');
  "

  echo "  $name → $VERSION"
done

# Pin cross-dependencies to exact version
echo ""
echo "Pinning cross-dependencies..."

for pkg in "${PACKAGES[@]}"; do
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
    let changed = false;
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (!p[depType]) continue;
      for (const [name, ver] of Object.entries(p[depType])) {
        if (name.startsWith('@flyingrobots/bijou')) {
          p[depType][name] = '$VERSION';
          changed = true;
        }
      }
    }
    if (changed) {
      fs.writeFileSync('$pkg', JSON.stringify(p, null, 2) + '\n');
      console.log('  ' + p.name + ': pinned internal deps → $VERSION');
    }
  "
done

echo ""
echo "Done. Recommended next steps:"
echo "  git add -A"
echo "  git commit -m 'chore(release): v$VERSION'"
echo "  git tag -a v$VERSION -m 'release: v$VERSION'"
echo "  git push origin <branch>"
echo "  git push origin v$VERSION"
