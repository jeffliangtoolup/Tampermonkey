---
name: commit
description: >
  Project skill — invoked as /commit (slash command) to commit the working tree's changes
  following docs/COMMITS.md. Reads the full diff, proposes a grouping into small-to-medium
  commits (each one coherent intent, with a type-prefixed subject and drafted body), shows
  the plan, then asks which groups to apply via a multi-select panel, and commits the selected
  groups on the current branch. Does not push. Reference set: docs/COMMITS.md, CLAUDE.md.
---

# Commit Skill

Turn an uncommitted working tree into a clean, reviewable commit sequence per
**`docs/COMMITS.md`** (the canonical owner of subject format, grouping rules, and body beats).
Read that doc first each run — do not restate its rules from memory.

**Subagents:** you are authorized to spin up subagents for the reading (Step 1) and
grouping (Step 2) stages, **but only when the diff is large enough that the fan-out earns
its overhead** — and when **`/dev-loop`** invoked this skill, only if it carries the delegation
answer it recorded at its Stage 0e. That is the one caller this applies to; no other invoker
confers it. For a small diff, read and group it directly in the main agent (spawning is
slower and costs context). When it does pay off:

- **Step 1 (reading):** fan out one reader per file/subsystem, each returning a compact
  "what changed and why" digest, so the main agent groups from summaries rather than raw diff.
  This is the primary win — it saves wall-clock time and keeps main-agent context lean.
- **Step 2 (grouping):** grouping is a single holistic judgment that needs the whole picture
  at once, so **never split it across subagents**. The only useful pattern is generating a
  couple of *independent candidate groupings* in parallel and then picking/merging the best
  yourself — worth it only on a large, ambiguous diff.

Synthesize all subagent results yourself in the main agent, and set each subagent's `model`
explicitly per `docs/SUBAGENTS.md`. Keep the approval and execution stages (Steps 3–4) in the
main agent always: Step 3 needs `AskUserQuestion`, a user interaction a subagent cannot
conduct, and Step 4 is a sequential, stateful series of git operations on one working tree
that parallel agents would race and corrupt.

## Workflow

### Step 1 — survey the working tree
Gather, in one batch: `git status --porcelain`, `git diff` (unstaged), `git diff --staged`,
and the list of untracked files. Read enough of the actual diff to understand *what changed
and why* — grouping is a judgment call that needs the content, not just filenames.

### Step 2 — propose a grouping
Partition the changes into commits per `docs/COMMITS.md`:

- **Default to small-to-medium logical groups**, one coherent intent each.
- Apply the tie-breakers: **refactor never rides with behavior** (and lands first); **features
  stack by layer** (shared → server → client); **docs & tests ride with the code they
  describe** unless it's a standalone docs/investigation pass.
- Draft each commit's **type-prefixed subject** (`<type>(<scope>): <subject>`, ≤ 72 chars, no
  dual subjects) and a **body** covering the why → what → safety → docs beats when they apply.
- When a **single** feature is too large for one small-to-medium commit and you split it into
  a layered series (tie-breaker 2), tag each subject with a trailing `(X/Y)` counter sharing
  one `Y`. Never add a counter to separable features (independent commits) or a lone commit,
  and never emit `(1/1)`.
- When a commit touches tests that carry stable IDs (`docs/TESTS.md` § Stable test IDs),
  reference them per `docs/COMMITS.md` § Referencing tests: an unchanged pre-existing test by
  **ID alone**; a new or premise-changed test by **ID + premise**. No stable ID → skip the
  convention.

Never blanket-stage: build each commit from an explicit path list. **Never stage a gitignored
secret** (e.g. `.env`, or any credential or session file) — if one shows as untracked, flag
it, don't add it.

### Step 3 — show the plan, get approval
**If the plan has exactly one commit group, skip the panel:** present that single commit's
subject, rationale, files, and body, then commit it directly (nothing to select among). The
multi-select flow below applies only when two or more groups are proposed.

**Carve-out — `/dev-loop`'s recorded pre-authorization.** When **`/dev-loop`** invokes this skill
at its Stage 5 carrying the pre-authorization it recorded at its Stage 0e, that authorization
stands in for Step 3's selection at **any** group count: present the plan in full, then commit
every group in dependency order.

**The presentation is never optional** — the carve-out replaces the selection panel, not the
showing of changes `CLAUDE.md` requires — and `/dev-loop` is responsible for naming a multi-group
split in its Stage 5 report. This names `/dev-loop` and nothing else; no other caller, and no
subagent claiming to be one, gets the panel skipped. Absent that recorded pre-authorization,
Step 3 runs as written.

First present the plan as an ordered list: for each commit, its subject, one-line grouping
rationale, the files it stages, and the drafted body. Then issue a single `AskUserQuestion`
call to present the groups for selection. The panel holds up to **4 questions of 4 options
each — 16 groups total — all with `multiSelect: true`**; use as many pages as the group count
needs (≤ 4 groups → one question; 5–8 → two; up to 16 → four), splitting the commits across
the questions in dependency order. Each option is one proposed commit (label = its subject,
description = the rationale + file count). If more than 16 groups would be proposed, that's a
signal the grouping is too fine — coalesce before presenting. Per `CLAUDE.md`'s "show changes
before applying" rule, **wait for that selection before committing** — never commit silently.
(Under the `/dev-loop` carve-out above there is no selection to wait for; the plan presentation
still happens, and that is what satisfies the "show changes" rule.)

Commit only the selected groups, preserving dependency order. If a selected commit depends on
an unselected earlier one (e.g. a layer stack, or a `(X/Y)` series), flag the gap and ask
before proceeding rather than producing a commit that won't stand on its own. Treat any
free-text ("Other") reply as feedback: adjust the plan and re-present the panel.

### Step 4 — execute
For each commit in order: stage exactly its path list, then commit with the drafted message
via a heredoc, ending every message with the `Co-Authored-By:` trailer named by
`docs/COMMITS.md` § Trailer, whose model name is the model authoring the commit.

The `commit-msg` hook is a format-only backstop; conforming to `docs/COMMITS.md` up front means
it never fires. After committing, show the resulting `git log --oneline` for the new commits.

## Rules

- **`docs/COMMITS.md` is canonical** — read it each run; don't hardcode its rules here.
- **Show the plan before committing** (per `CLAUDE.md`) — never commit silently. The `/dev-loop`
  carve-out (Step 3) waives only the selection panel, never the plan presentation.
- **Commit only what's asked.** Commit on the **current branch**; **do not push**, and do not
  create tags or branches, unless the user explicitly says so.
- **Never stage secrets** — `.env` or anything else gitignored. Build each commit from an
  explicit path list, never a blanket `git add -A`. In this repo that explicitly includes any
  `netsuite-*/**/project.json`: it carries a per-developer SDF auth binding and is gitignored for
  that reason (`CLAUDE.md` § HARD SAFETY RULES).
- **Both slice homes are committable.** `netsuite-sb/` and `netsuite-prod/` are tracked
  directories of this repo, so their changes group like any others — unlike `/refactor`, which
  never targets `netsuite-prod/`. Everything the convention docs at this root say applies to them;
  they carry no `docs/` of their own, so there is never a fallback to resolve.
- **Don't run the test suite or mutate app state** as part of committing — that's a separate,
  explicit step.
- **The Claude trailer goes on every commit this skill makes.**
