#!/usr/bin/env bash
# Builds the store package: only what ships, with manifest.json at the top
# level. Both stores reject a zip with a wrapper folder.
set -euo pipefail
cd "$(dirname "$0")"

node --check content.js
node --check inject.js
node check.js

VERSION=$(node -p "require('./manifest.json').version")
OUT="lobby-filter-for-autodarts-$VERSION.zip"

rm -f "$OUT"
zip -qr "$OUT" manifest.json inject.js content.js panel.css icons
echo "$OUT"
