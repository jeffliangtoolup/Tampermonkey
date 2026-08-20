#!/bin/sh
# check-secrets.sh — refuse to let a credential reach a tracked file.
# Canonical rules: docs/SAFETY-MODES.md → The secret gate.
#
#   scripts/check-secrets.sh            # every tracked text file
#   scripts/check-secrets.sh --staged   # staged content only (the pre-commit path)
#   scripts/check-secrets.sh PATH ...   # named files
#
# Exits non-zero on any hit, printing `path:line` and the pattern's label — never the
# matched text, so the gate itself cannot leak what it caught. Read-only: never edits.

set -u

# ── Patterns ────────────────────────────────────────────────────────────────────
# `label|flags|extended-regex`, one credential shape per line — `flags` holds extra
# grep options (`-i` for a shape whose key name varies in case) and is usually empty.
# A detector must be PRECISE, not broad: it runs over docs that quote these very
# patterns, so it matches on a plausible VALUE rather than on a key name alone. The
# starter list is deliberately conservative — tuning it is expected, not a sign it's
# broken.
#
# `basic-auth-header` and `cli-userpass-flag` sit in the generic list because each carries a
# value with no key name beside it — `assigned-secret` below keys off a name and misses both.
#
# TODO(template): add this project's own credential shapes — the session token, the
# vendor key prefix, the signed-URL parameter. The generic list catches generic
# leaks; the credential that actually leaks is project-shaped.
PATTERNS='private-key||-----BEGIN [A-Z ]*PRIVATE KEY-----
aws-access-key||AKIA[0-9A-Z]{16}
url-credentials||://[^/[:space:]:@]+:[^/[:space:]@]{6,}@
bearer-token|-i|bearer [A-Za-z0-9._-]{20,}
basic-auth-header|-i|basic [A-Za-z0-9+/]{24,}={0,2}
cli-userpass-flag||-u[[:space:]]+[^[:space:]:]+:[^[:space:]]{12,}
assigned-secret|-i|(api[_-]?key|apikey|secret|token|password|passwd)[^[:alnum:][:space:]]{0,1}[[:space:]]*[:=][[:space:]]*[^[:alnum:][:space:]]{0,2}[A-Za-z0-9/+._-]{16,}'

# A line matching this documents a shape; it does not carry a value.
PLACEHOLDER='REDACTED|PLACEHOLDER|EXAMPLE|CHANGE_?ME|YOUR_|your_|xxxx|<[A-Za-z_-]+>|\$\{|\$[A-Z_]+'

# Never scanned: this gate and the doc explaining it (both quote the patterns),
# *.example files (they carry shapes by design), and binaries / lockfiles.
is_excluded() {
  case "$1" in
    scripts/check-secrets.sh|.githooks/pre-commit|docs/SAFETY-MODES.md) return 0 ;;
    *.example|*.example.*|*.png|*.jpg|*.jpeg|*.gif|*.svg|*.pdf|*.zip|*.gz|*.har) return 0 ;;
    *.ico|*.woff|*.woff2|*.lock|*-lock.json|*.lockb) return 0 ;;
  esac
  return 1
}

# ── Scan ────────────────────────────────────────────────────────────────────────
mode=worktree
case "${1:-}" in --staged) mode=staged; shift ;; esac

if [ "$#" -gt 0 ]; then
  files=$(printf '%s\n' "$@")
elif [ "$mode" = staged ]; then
  files=$(git diff --cached --name-only --diff-filter=ACM)
else
  files=$(git ls-files)
fi

# Staged blobs and worktree files differ; the commit is what ships, so gate that.
read_content() {
  if [ "$mode" = staged ]; then git show ":$1" 2>/dev/null; else cat "$1" 2>/dev/null; fi
}

hits=0
scanned=0
old_ifs=$IFS
IFS='
'

for file in $files; do
  is_excluded "$file" && continue
  content=$(read_content "$file")
  [ -n "$content" ] || continue
  scanned=$((scanned + 1))

  for pattern in $PATTERNS; do
    label=${pattern%%|*}
    rest=${pattern#*|}
    flags=${rest%%|*}
    regex=${rest#*|}
    # $flags is deliberately unquoted (empty must expand to nothing). -e is required:
    # a pattern may start with `-` (the private-key header), which grep would
    # otherwise read as an option and reject.
    found=$(printf '%s\n' "$content" \
      | grep -nE $flags -e "$regex" \
      | grep -Eiv -e "$PLACEHOLDER")
    [ -n "$found" ] || continue
    for line in $found; do
      printf '  %s:%s  [%s]\n' "$file" "${line%%:*}" "$label" >&2
      hits=$((hits + 1))
    done
  done
done

IFS=$old_ifs

if [ "$hits" -gt 0 ]; then
  {
    echo ""
    echo "✗ possible credential in $hits location(s) — docs/SAFETY-MODES.md → The secret gate."
    echo "  A secret that reached git is compromised: rotate it first, then clean the file."
    echo "  False positive? Tighten PATTERNS in scripts/check-secrets.sh."
    echo "  One-off bypass: git commit --no-verify"
  } >&2
  exit 1
fi

printf '✓ no credential patterns in %s scanned file(s)\n' "$scanned"
