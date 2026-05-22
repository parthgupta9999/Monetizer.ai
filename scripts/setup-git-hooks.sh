#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
git config core.hooksPath scripts/hooks
chmod +x scripts/hooks/prepare-commit-msg scripts/hooks/commit-msg
echo "Git hooks enabled: scripts/hooks (Cursor co-author stripped)"
