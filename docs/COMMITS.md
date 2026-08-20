# Commit conventions

Conventions for grouping changes into commits and writing commit messages. The aim: a
`git log` that reads like a reviewable narrative — each commit one coherent, verifiable
unit, each subject scannable by type. Examples are illustrative.

## Subject line

Format: `<type>(<scope>): <imperative subject>`

- **Imperative mood, capitalized after the colon, no trailing period**, ≤ 72 chars.
  *e.g.* `fix(api): Reject expired tokens`, `refactor: Rename helper to clarify intent`.
- **Types** — the whole vocabulary; pick the one that names the commit's *primary* intent:
  - `feat` — new user- or API-visible behavior
  - `fix` — corrects wrong behavior
  - `refactor` — behavior-preserving change (rename, move, reshape, reformat)
  - `docs` — docs only (`docs/`, `README`, comments-only passes)
  - `test` — tests only
  - `chore` — build, deps, config, tooling
- **Scope** — optional, lowercase, one subsystem: *e.g.* `api`, `auth`, `ui`, `db`, `client`,
  `server`, `shared`. Omit when the change is genuinely cross-cutting; don't invent a scope
  to fill the slot.
- **No dual subjects.** A subject joined by `;` or `and` is a signal the commit should be
  split (see Grouping). One intent → one subject.
- **One line, then a blank line.** The subject is a single line of ≤ 72 chars; if the commit
  has a body, a blank line must separate them. This is a hard rule — the commit-msg hook
  rejects a subject that runs past 72 chars or into the body with no blank line. It guarantees
  the title fits the field and never bleeds into the body.
- **Feature-series counter `(X/Y)` — large multi-commit features only.** When one feature is
  too large to land as a single small-to-medium commit and is split into an ordered series
  (Grouping rule 2), tag each subject with a trailing `(X/Y)`, where `1 ≤ X ≤ Y` and `Y` is the
  series length: `feat(api): Add the batch endpoints (2/4)`. Every commit in one series shares
  the same `Y`. Use it **only** for a split feature — never on distinctly separable features
  (those are independent commits) and **never** `(1/1)` (a lone commit carries no counter). The
  hook validates the arithmetic and rejects `(1/1)`; deciding whether the work is one large
  feature or separable features is a human / `/commit` judgment.

## Grouping

**Default: commit in logical groups, biased small-to-medium. One coherent intent per commit.**

When a group is ambiguous or growing large, these tie-breakers decide how to subdivide:

1. **Refactor never rides with behavior.** A rename, move, or reformat does not share a
   commit with a logic change. If a change did both, that's two commits — and the refactor
   usually lands first so the behavior commit's diff is small.
2. **Features stack by layer.** Build a feature as an ordered chain rather than one blob:
   shared contract → server implementation → client wiring. Each commit compiles. If the
   series is large, tag each subject with a `(X/Y)` counter (see Subject line).
3. **Docs and tests ride with the code they describe** — the same commit that adds behavior
   adds its tests and updates the doc that owns the affected fact. *Exception:* a standalone
   documentation or investigation pass is its own `docs:` commit.

Rules 1–2 push toward smaller commits; rule 3 prevents over-splitting. "Bias small-to-medium"
means: prefer the smaller grouping whenever the tie-breakers make one available, but never
split a single atomic change across commits that don't each stand on their own.

## Body

Freeform prose, wrapped ~72 chars. No mandatory headers, but cover these beats in order when
they apply:

- **Why** — the problem or decision that motivated the change, first.
- **What** — the change itself; a bulleted list of touched areas is welcome for multi-file
  commits.
- **Safety** — for anything touching a guarded path, state the mock-vs-live posture
  (e.g. "Still mocked by default").
- **Docs** — reference the canonical decision it extends or adds (e.g. "Adds C4; updates
  ARCHITECTURE.md"). Decisions are owned by `docs/`, not the commit — link, don't restate.

## Referencing tests

When a commit message refers to a specific test that has a stable ID — the per-file
letter+number scheme owned by [`docs/TESTS.md`](TESTS.md) § Stable test IDs (`A1`, `B2`, `C4`, …):

- **Pre-existing test, premise unchanged** → reference it by **ID alone**: *"Still covered by
  B2."* The premise already lives in the test under a stable ID; restating it is redundant.
- **New test, or a test whose premise changed** → give the **ID and its premise**: *"Add C4:
  an expired token is rejected."* A reader can't look up a premise that didn't exist before
  (or that just changed), so the message must carry it.
- **No stable ID exists** for the test → this convention doesn't apply; describe the test
  however reads best.

This is a body/subject content rule, not a mechanical one — the commit-msg hook does not (and
cannot) check it. It's applied by hand and by `/commit`.

## Trailer

Commits authored with Claude Code end with a `Co-Authored-By:` trailer naming **the model that
authored the commit** — read from the model actually doing the work, never copied forward from
an earlier commit:

```
Co-Authored-By: Claude <model name> <noreply@anthropic.com>
```

A commit authored by Opus 5, for example, ends with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

Hand-typed human commits omit it. (The commit-msg hook checks *format* only and does not
enforce this trailer.)

## Enabling the hook

The format gate lives in [`.githooks/commit-msg`](../.githooks/commit-msg). Git does not pick
up a repo's `.githooks/` automatically — point it there once per clone:

```bash
git config core.hooksPath .githooks
```

## Decision rule

If you can't write a single-clause subject for the staged diff without `;` or `and`, the
commit is doing two things — split it.
