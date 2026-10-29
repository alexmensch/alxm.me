#!/usr/bin/env bash
# skill-guard: PreToolUse hook on Skill / Edit / Write / NotebookEdit. Denies
# an edit to a stylesheet until the cube-css skill has been invoked this session.
#
# State is keyed on $PPID (the Claude Code process, stable across a session's
# hook calls); $GUARD_SESSION overrides it for a harness that spawns a fresh
# shell per call.

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "skill-guard: jq is not installed, so stylesheet edits cannot be checked. Install jq (brew install jq) and retry." >&2
  exit 2
fi

STATE_DIR="${TMPDIR:-/tmp}/claude-skill-guard"
mkdir -p "$STATE_DIR"
marker() { echo "$STATE_DIR/$1-${GUARD_SESSION:-$PPID}"; }

input="$(cat)"
tool="$(printf '%s' "$input" | jq -r '.tool_name // ""')"

if [ "$tool" = "Skill" ]; then
  invoked="$(printf '%s' "$input" | jq -r '.tool_input.skill // ""')"
  bare="${invoked##*:}"
  if [[ "$bare" =~ ^[A-Za-z0-9_-]+$ ]]; then : > "$(marker "$bare")"; fi
  exit 0
fi

file_path="$(printf '%s' "$input" | jq -r '
  .tool_input.file_path
  // .tool_input.notebook_path
  // .tool_input.path
  // ""
')"

case "$file_path" in
  *.scss|*.css) skill=cube-css ;;
  *) exit 0 ;;
esac

state_file="$(marker "$skill")"
if [ -f "$state_file" ]; then exit 0; fi

reason="Refusing $tool on $(basename "$file_path") — invoke the $skill skill first this session.

CLAUDE.md § SCSS Structure documents where files live, not the system underneath; having read it is not having loaded the skill.

Fix: call the Skill tool with skill '$skill', then retry the edit.

If you have just done that and this still denies, your harness does not run PreToolUse on Skill calls: arm the session by creating $state_file and carry on — do not invoke the skill a third time."

jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
