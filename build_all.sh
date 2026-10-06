#!/bin/sh
# Rebuild everything into ./docs  (needs node + python3 with Pillow, fontTools, skia-pathops)
set -e
cd "$(dirname "$0")"
mkdir -p build
python3 tools/build_font.py src/engine.js docs/fonts
node tools/export_sprites.mjs build/sprites.json
python3 tools/make_assets.py build/sprites.json docs
node tools/build.mjs
python3 tools/make_kits.py

# full asset library (needs a static server on docs/ at :8800)
node tools/export_library.mjs build/library.json
python3 tools/make_library.py build/library.json build/out
echo "OK: docs/ ready, library in build/out"
