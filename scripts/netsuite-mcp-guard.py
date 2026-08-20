#!/usr/bin/env python3
"""PreToolUse guard for the mcp__netsuite__ server: refuse prod writes, prompt for sandbox writes.

Reads a Claude Code hook payload on stdin and prints a PreToolUse decision on stdout.
The rule this enforces, and the procedure for removing it, are owned by CLAUDE.md
-> HARD SAFETY RULES. Fails closed: anything it cannot classify is treated as a write.
"""

import json
import sys

# Tools that cannot write, whatever else they are passed.
READ_ONLY_TOOLS = frozenset({"describeRecordType", "getScriptLogs"})

# SuiteQL accepts SELECT only; a leading keyword outside this set is not a query we recognize.
READ_ONLY_QUERY_KEYWORDS = frozenset({"SELECT", "WITH"})

# For tools whose HTTP method decides: the methods that only read.
READ_ONLY_METHODS = frozenset({"GET"})


def is_write(tool: str, tool_input: dict) -> bool:
    """Classify one mcp__netsuite__ call. Unknown tool, unknown method, or unparseable
    query all classify as a write — a new write-capable tool must not arrive unguarded."""
    if tool in READ_ONLY_TOOLS:
        return False

    if tool == "suiteql":
        query = str(tool_input.get("query") or "").lstrip().lstrip("(")
        keyword = query.split(None, 1)[0].upper() if query else ""
        return keyword not in READ_ONLY_QUERY_KEYWORDS

    # restTransform posts a new record; it has no read form.
    if tool == "restTransform":
        return True

    if tool in ("restRecord", "restlet"):
        return str(tool_input.get("method") or "").upper() not in READ_ONLY_METHODS

    return True


def build_decision(tool: str, tool_input: dict) -> dict | None:
    """Return the PreToolUse decision for one call, or None to stay out of the way."""
    if not is_write(tool, tool_input):
        return None

    env = str(tool_input.get("env") or "sandbox").lower()
    if env == "prod":
        return {
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"BLOCKED: {tool} would write to the NetSuite production account. This project's "
                "hard rule forbids every prod write from this repo — see CLAUDE.md -> HARD "
                "SAFETY RULES. Re-run against sandbox (env=sandbox), or have Jordan remove the "
                "rule deliberately. Do not retry with different arguments."
            ),
        }

    return {
        "permissionDecision": "ask",
        "permissionDecisionReason": (
            f"{tool} would write to the NetSuite sandbox account. Sandbox writes are permitted "
            "only with explicit approval, per CLAUDE.md -> HARD SAFETY RULES."
        ),
    }


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
        tool_name = str(payload.get("tool_name") or "")
        tool_input = payload.get("tool_input") or {}
        if not isinstance(tool_input, dict):
            raise ValueError("tool_input is not an object")
    except (json.JSONDecodeError, ValueError) as exc:
        # An unreadable payload means the target account is unknown, so prod is possible.
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"BLOCKED: the NetSuite MCP guard could not read this call ({exc}), so it "
                    "cannot prove the target is sandbox. Failing closed per CLAUDE.md -> HARD "
                    "SAFETY RULES."
                ),
            }
        }))
        return 0

    decision = build_decision(tool_name.rsplit("__", 1)[-1], tool_input)
    if decision is None:
        return 0

    decision["hookEventName"] = "PreToolUse"
    print(json.dumps({"hookSpecificOutput": decision}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
