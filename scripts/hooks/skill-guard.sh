#!/usr/bin/env bash
# skill-guard: PreToolUse hook on Skill / Edit / Write / NotebookEdit. Denies
# an edit to a stylesheet until the cube-css skill has been invoked this session.
#
# State is keyed on $PPID (the Claude Code process, stable across a session's
# hook calls); $GUARD_SESSION overrides it for a harness that spawns a fresh
# shell per call.

set -euo pipefail

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

Stylesheets here are CUBE CSS over Every Layout primitives: which layer a rule belongs in, why utilities load last and carry !important, the no-width-media-query mandate, and the review gates (a hardcoded value on first use, a z-index where source order would do, a minmax() with no min(…, 100%) guard). CLAUDE.md § SCSS Structure documents where files live, not the system underneath, so having read it is not having loaded the skill. Reach for the utopia skill alongside it when the change touches a type size, a space step or a clamp().

Fix: call the Skill tool with skill '$skill', then retry the edit.

If you have just done that and this still denies, your harness does not run PreToolUse on Skill calls: arm the session by creating $state_file and carry on — do not invoke the skill a third time."

jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
