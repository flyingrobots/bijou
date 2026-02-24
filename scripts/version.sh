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

# Find all workspace package.json files
PACKAGES=("$ROOT"/packages/*/package.json)

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
echo "Done. Run: git add -A && git commit -m 'v$VERSION' && git tag v$VERSION && git push --tags"
