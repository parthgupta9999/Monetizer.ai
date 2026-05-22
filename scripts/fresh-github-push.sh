#!/bin/sh
# Push a single clean commit (no Cursor co-author). Run in Terminal.app, NOT from Cursor.
set -e
cd "$(dirname "$0")/.." || exit 1

REMOTE="${1:-origin}"
BRANCH="${2:-main}"

./scripts/setup-git-hooks.sh

git rm --cached -f .DS_Store .gradio/certificate.pem 2>/dev/null || true

TREE=$(git write-tree)
export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-Parth Gupta}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-parthgupta9999@gmail.com}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-Parth Gupta}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-parthgupta9999@gmail.com}"

NEW=$(printf '%s\n' "Monetizer.ai: initial public release" | git commit-tree "$TREE")
git update-ref "refs/heads/$BRANCH" "$NEW"
git symbolic-ref HEAD "refs/heads/$BRANCH" 2>/dev/null || true

echo "Clean commit: $NEW"
echo "Pushing to $REMOTE $BRANCH ..."
git push -f "$REMOTE" "$BRANCH"
echo "Done. Contributors sidebar should only list you after a fresh empty repo."
