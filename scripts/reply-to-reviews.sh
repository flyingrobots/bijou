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

# --- Resolve repo -----------------------------------------------------------
# Moved after preflight so `gh` is guaranteed to exist.
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q '.nameWithOwner')}"
OWNER="${REPO%/*}"
NAME="${REPO#*/}"

# --- Fetch unresolved review threads via GraphQL ----------------------------
echo "Fetching unresolved review threads for PR #${PR_NUMBER}..."

THREADS_JSON=$(gh api graphql -f query='
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          comments(first: 20) {
            nodes {
              databaseId
              author { login }
              path
              body
            }
          }
        }
      }
    }
  }
}' -F owner="$OWNER" -F name="$NAME" -F number="$PR_NUMBER")

# Filter: unresolved threads started by the bot, without a human reply
BOT_THREADS=$(echo "$THREADS_JSON" | jq --arg bot "$BOT_LOGIN" '
  [.data.repository.pullRequest.reviewThreads.nodes[]
    | select(.isResolved == false)
    | select(.comments.nodes[0].author.login == $bot)
    | {
        id: .comments.nodes[0].databaseId,
        path: .comments.nodes[0].path,
        body: .comments.nodes[0].body,
        hasHumanReply: ([.comments.nodes[1:][] | select(.author.login != $bot)] | length > 0)
      }
    | select(.hasHumanReply == false)
  ]
')

THREAD_COUNT=$(echo "$BOT_THREADS" | jq 'length')

if [ "$THREAD_COUNT" -eq 0 ]; then
  echo "No unresolved CodeRabbit review threads found."
  exit 0
fi

echo "Found $THREAD_COUNT unresolved CodeRabbit thread(s)."

# --- Process threads ---------------------------------------------------------
REPLIED=0
SKIPPED=0

for i in $(seq 0 $((THREAD_COUNT - 1))); do
  THREAD=$(echo "$BOT_THREADS" | jq ".[$i]")
  THREAD_ID=$(echo "$THREAD" | jq -r '.id')
  THREAD_PATH=$(echo "$THREAD" | jq -r '.path // "N/A"')
  THREAD_BODY=$(echo "$THREAD" | jq -r '.body' | head -5)

  if [ "$BATCH_MODE" = true ]; then
    echo "  Replying to thread $THREAD_ID ($THREAD_PATH)..."
    gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
      -f body="$BATCH_MESSAGE" \
      -F in_reply_to="$THREAD_ID" \
      --silent
    REPLIED=$((REPLIED + 1))
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
            --silent
          REPLIED=$((REPLIED + 1))
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
