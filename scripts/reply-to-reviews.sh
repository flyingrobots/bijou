#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# reply-to-reviews.sh — Reply to CodeRabbit review threads on a GitHub PR.
#
# Usage:
#   ./scripts/reply-to-reviews.sh <PR_NUMBER>              # Interactive mode
#   ./scripts/reply-to-reviews.sh <PR_NUMBER> --resolve-all "message"  # Batch mode
#
# Interactive mode: prompts per unresolved CodeRabbit thread.
# Batch mode: replies to all unresolved threads with the given message.
#
# Requires: gh (GitHub CLI), jq
# ---------------------------------------------------------------------------

BOT_LOGIN="coderabbitai[bot]"

usage() {
  echo "Usage: $0 <PR_NUMBER> [--resolve-all \"message\"]"
  exit 1
}

# --- Args -------------------------------------------------------------------
[ $# -lt 1 ] && usage
PR_NUMBER="$1"
shift

BATCH_MODE=false
BATCH_MESSAGE=""

if [ $# -ge 2 ] && [ "$1" = "--resolve-all" ]; then
  BATCH_MODE=true
  BATCH_MESSAGE="$2"
  shift 2
fi

# --- Preflight ---------------------------------------------------------------
for cmd in gh jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required but not found in PATH." >&2
    exit 1
  fi
done

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q '.nameWithOwner')}"

# --- Fetch review comments ---------------------------------------------------
echo "Fetching review comments for PR #${PR_NUMBER}..."

COMMENTS=$(gh api --paginate "repos/${REPO}/pulls/${PR_NUMBER}/comments" 2>/dev/null)

# Extract CodeRabbit thread-starting comments (in_reply_to_id is null)
BOT_THREADS=$(echo "$COMMENTS" | jq -r --arg bot "$BOT_LOGIN" '
  [ .[] | select(.user.login == $bot and .in_reply_to_id == null) ]
')

THREAD_COUNT=$(echo "$BOT_THREADS" | jq 'length')

if [ "$THREAD_COUNT" -eq 0 ]; then
  echo "No CodeRabbit review threads found."
  exit 0
fi

echo "Found $THREAD_COUNT CodeRabbit thread(s)."

# --- Build set of threads with existing human replies ------------------------
HUMAN_REPLIED=$(echo "$COMMENTS" | jq -r --arg bot "$BOT_LOGIN" '
  [ .[] | select(.user.login != $bot and .in_reply_to_id != null) | .in_reply_to_id ] | unique
')

# --- Process threads ---------------------------------------------------------
REPLIED=0
SKIPPED=0

for i in $(seq 0 $((THREAD_COUNT - 1))); do
  THREAD=$(echo "$BOT_THREADS" | jq ".[$i]")
  THREAD_ID=$(echo "$THREAD" | jq -r '.id')
  THREAD_PATH=$(echo "$THREAD" | jq -r '.path // "N/A"')
  THREAD_BODY=$(echo "$THREAD" | jq -r '.body' | head -5)

  # Skip threads that already have a human reply
  HAS_REPLY=$(echo "$HUMAN_REPLIED" | jq --argjson id "$THREAD_ID" 'any(. == $id)')
  if [ "$HAS_REPLY" = "true" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [ "$BATCH_MODE" = true ]; then
    echo "  Replying to thread $THREAD_ID ($THREAD_PATH)..."
    gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
      -f body="$BATCH_MESSAGE" \
      -F in_reply_to="$THREAD_ID" \
      --silent     REPLIED=$((REPLIED + 1))
  else
    echo ""
    echo "--- Thread $((i + 1))/$THREAD_COUNT ---"
    echo "File: $THREAD_PATH"
    echo "Comment:"
    echo "$THREAD_BODY"
    echo "..."
    echo ""
    read -rp "Reply? (y=reply, s=skip, q=quit) " choice
    case "$choice" in
      y|Y)
        read -rp "Your reply: " reply_text
        if [ -n "$reply_text" ]; then
          gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
            -f body="$reply_text" \
            -F in_reply_to="$THREAD_ID" \
            --silent           REPLIED=$((REPLIED + 1))
          echo "  ✓ Reply posted."
        else
          echo "  Empty reply — skipped."
          SKIPPED=$((SKIPPED + 1))
        fi
        ;;
      s|S)
        SKIPPED=$((SKIPPED + 1))
        ;;
      q|Q)
        echo "Quitting."
        break
        ;;
      *)
        echo "  Unknown choice — skipped."
        SKIPPED=$((SKIPPED + 1))
        ;;
    esac
  fi
done

echo ""
echo "Done. Replied: $REPLIED, Skipped: $SKIPPED (of $THREAD_COUNT total threads)."
