# Comments

Conventions for comments in this codebase — the input/output + dependency style. The aim:
comments that explain behavior a reader can't infer from the code, not ones that mirror it back.

## What to Keep

- **Function descriptions** — input/output contract, what the function produces, and what depends on it
- **Non-obvious behavior** — edge cases, gotchas, or side effects a reader couldn't infer from the code
- **Key line explanations** — short inline notes on lines that would cause a "why does this exist?" pause
- **Architectural decisions or intentional workarounds** — e.g., `// using polling here because the websocket events are unreliable in Safari`

## What to Remove

- Comments that restate what the code already clearly says
- Step-by-step narration of logic that is self-evident from reading it
- Explanations of *why something works* at an implementation level (trust the reader to understand the language)
- Commented-out code — delete it; git history is the record
- Comments that reference fix history — notes describing a past state or a change made (e.g. `// no longer skipped`, `// fixed: …`). Describe what the code does now; git history is the record of how it got there
- Facts already owned by a canonical doc — anything stated in `CLAUDE.md` or under `docs/`
  (run commands, architecture, protocol/contract tables). The doc owns it; link or defer to
  the doc, don't restate it inline.

## Style

- Function comments: describe inputs, outputs, and dependents — not internal mechanics
- Inline comments: one short phrase, not a sentence explaining the obvious
- Bias toward *what this produces and who uses it* over *how it achieves it*
- Don't add JSDoc/docstrings to functions whose signature and name are already self-documenting
- Reserve JSDoc/docstrings for public API surfaces or functions with non-obvious parameter constraints
- Do not change any logic when adding, removing, or editing comments
- Cap a function-header comment at **5 lines**. If the contract needs more, the overflow isn't
  header material — it belongs in a doc or a regeneratable artifact, not the header.
- Test IDs: the per-file letter+number scheme is owned by [`TESTS.md`](TESTS.md) § Stable test
  IDs — including the cross-tree uniqueness rule and the meta-test that enforces it.

## Placement

Before keeping comment text, decide its best home: (1) this comment, (2) a canonical doc
(`CLAUDE.md` or a `docs/` file), or (3) a regeneratable artifact. Keep only what truly belongs
in the header; anything that belongs elsewhere comes out of the code. **The placement
reasoning itself never goes in the codebase** — it belongs in the change report, not in a
comment.

## TODOs

- Must include a reason and optionally a ticket: `// TODO(#123): replace once API supports batch deletes`
- Remove TODOs when the work is done — don't leave them as history

## Freshness

- When editing logic, update or remove any comments on that block in the same change
- Check comments for stale data — claims, dates, counts, names, or cross-references that no
  longer match the code; correct it, or remove it if it no longer serves a purpose

## Decision Rule

If a comment would still make sense after renaming all variables to `a`, `b`, `c` — it's explaining behavior, keep it.
If it just mirrors the variable names back in English — remove it.
