#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <new-version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

VERSION="$1"

# Validate semver-ish format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in X.Y.Z format (e.g. 0.2.0)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Portable in-place sed (works with both GNU and BSD sed)
sedi() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

# Update frontend/package.json
sedi "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" "$SCRIPT_DIR/frontend/package.json"

# Update backend/pyproject.toml
sedi "s/^version = \".*\"/version = \"${VERSION}\"/" "$SCRIPT_DIR/backend/pyproject.toml"

echo "Version bumped to ${VERSION} in:"
echo "  - frontend/package.json"
echo "  - backend/pyproject.toml"
