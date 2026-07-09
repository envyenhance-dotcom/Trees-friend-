#!/bin/bash
set -e

cd "$(dirname $0)"
echo "=== Building tree-marketplace ==="
# Run pnpm build from the workspace root
pnpm --filter @workspace/tree-marketplace run build

echo "=== Checking output ==="
ls -la artifacts/tree-marketplace/dist/
echo "Build complete!"