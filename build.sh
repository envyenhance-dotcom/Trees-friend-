#!/bin/sh
set -e

echo "=== Building tree-marketplace ==="
pnpm --filter @workspace/tree-marketplace run build

echo "=== Checking output ==="
ls -a artifacts/tree-marketplace/dist/
echo "Build complete!"