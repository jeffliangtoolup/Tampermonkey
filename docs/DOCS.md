# Docs

The routing table for every `.md` in this repo: which file owns which kind of information, and
what keeps each one true. [`COMMENTS.md`](COMMENTS.md) governs what belongs in code; this doc
governs what belongs in a markdown file, and which one.

A doc is read because someone trusts it. One stale claim costs more than the doc ever saved:
the reader now has to verify everything, which is the state that existed before it was written.

## Conformance

Every `.md` in this repo is exactly one of two things:

- **Durable** — it has a row in [`ARCHITECTURE.md`](ARCHITECTURE.md)'s doc index naming what it
  owns, and every rule below binds it.
- **Temporary** — it lives in `scratch/` and states its deletion trigger on line one.

There is no third kind. An unindexed `.md` outside `scratch/` is a file with no owner and no
expiry — the exact defect these rules exist to prevent — so the check is one command:

```bash
find . -name '*.md' -not -path './scratch/*' -not -path './node_modules/*' \
     -not -path './.git/*' | sed 's|^\./||' |
  while read -r f; do grep -qF "\`$f\`" docs/ARCHITECTURE.md || echo "UNINDEXED $f"; done
```

Silence means every durable `.md` has a declared owner. A new doc conforms when its row exists
and states what it owns in one line — which is also the moment `CLAUDE.md`'s pointer list gains
its entry.

## Part 1 — rules for every `.md`

### Three kinds of sentence

Maintenance load is not spread evenly. Every sentence in a doc is one of:

| Kind | Example | Goes stale when |
|---|---|---|
| **Claim** | a path, a command, a count, a version, a description of behavior | the repo changes underneath it |
| **Rule** | "never stage a gitignored secret" | someone repeals it — never on its own |
| **Orientation** | why a thing exists, what problem it solves | the design changes shape |

**Claims carry nearly all the rot**, and they are the only kind checkable against the repo.
When editing a doc, find the claims first.

### Freshness

- **A doc updates in the commit that falsifies it** — not a follow-up, not a cleanup pass. The
  rule [`COMMENTS.md`](COMMENTS.md) applies to comments, one level up: if the change makes a
  sentence untrue, the change fixes the sentence.
- **The commit that adds a fact adds it once**, to its owner in
  [`ARCHITECTURE.md`](ARCHITECTURE.md)'s index. Everything else links.
- **No timestamps, no "last reviewed", no doc changelogs.** A stamp records that someone
  looked, not that the doc is true, and a reader can't tell those apart. Git owns *when*; the
  doc owns *what*.
- **No "Done" / "Changelog" / "History" sections.** Fix history in a doc is the same defect as
  fix history in a comment — git already has it.
- **No dates, and nothing in the past tense.** "Previously X", "as of `2026-06` this returned
  Y", "the old loader did Z" — the change that made a sentence past tense is the change that
  deletes it, not the one that annotates it. Settled behavior is described in the present
  tense, undated.
- **A date earns its place only on behavior still in flux** — an implementation that hasn't
  stabilized or is actively being worked. There the date is load-bearing: it tells the reader
  how old the uncertainty is. When the behavior settles, the date goes with it. Dates that stay
  are absolute (`2026-08-19`), never relative.

### Accuracy

- **Every claim names its falsifier.** If nothing in the repo could prove a sentence wrong, it
  isn't a claim — it's decoration, and it goes.
- **Verify or delete. Never hedge.** A claim you can't confirm right now does not get softened
  ("should", "generally", "may"), marked TODO, or left standing. Hedging preserves the sentence
  and destroys its usefulness.
- **A deleted claim leaves no scar** — no "(removed, was out of date)" note. The absence is the
  correct record.
- **When two docs disagree, the owner wins and the other links.** Don't reconcile the copies;
  delete the copy.
- **Cross-references are claims.** A link to a doc, a section, or a `file:line` is falsifiable
  exactly like a command is.

### Succinctness

Length is a symptom, not the target. Cut by rule, not by feel — a doc is the right length when
nothing below applies to it:

- **Owned elsewhere → link.** A second copy is drift with a head start.
- **Recorded by git → delete.** What changed, when, by whom, and what it used to be.
- **True of software generally → delete.** Advice that would read the same in any repo teaches
  nothing about this one.
- **An example that changes no decision → delete.** Keep the example that disambiguates a rule;
  cut the one that illustrates it a second time.
- **A rule with no consequence → delete it or give it one.** "Prefer X", unchecked and
  unenforced, is a preference, not a convention.
- **Preamble about the doc itself → delete.** The reader is already here.

**The subtraction test:** delete the sentence and ask what a reader would then do wrong. If the
answer is nothing, it was never load-bearing.

## Part 2 — the five surfaces

Where a given fact goes:

| The fact is… | It belongs in |
|---|---|
| a rule the agent must obey unprompted | `CLAUDE.md` |
| the steps of a repeatable task | the skill that performs it |
| a convention, taxonomy, or system model | the `docs/` file that owns it |
| how a human gets from clone to running | `README.md` |
| agreed but unbuilt work | [`WORK-ITEMS.md`](WORK-ITEMS.md) |
| why the code got this way | git history — no file |
| working state for a task in flight | `scratch/`, deleted when the task ends |

### 1. `CLAUDE.md`

**Read when:** every session, in full, before the agent does anything.

**Belongs:** standing rules the agent must obey without being asked (safety, workflow, approval
gates) · the commands to run the project · one-line pointers to the doc that owns each
convention · project-specific gotchas that change what the agent does.

**Doesn't belong:**

- the reasoning behind a rule → the doc that owns the rule
- system model or architecture narrative → [`ARCHITECTURE.md`](ARCHITECTURE.md)
- the steps of a specific task → the skill that performs it
- anything only a human needs → `README.md`
- status, roadmap, what's next → [`WORK-ITEMS.md`](WORK-ITEMS.md)

**Freshness trigger:** a rule changes, a command changes, or a doc is added, renamed, or retired.

**Test:** would the agent behave differently if this line were deleted? If not, cut it — every
line here is paid for on every session.

### 2. Skills — `.claude/skills/*/SKILL.md`

**Read when:** only when triggered — invoked by name, or matched by its frontmatter
`description`.

**Belongs:** frontmatter `name` and `description` · the procedure: ordered steps, decision
points, stop conditions · the **reference set** — paths to the docs the procedure reads at
runtime · the rules the procedure itself needs (what it may not do, who may invoke it).

**Doesn't belong:**

- convention content a `docs/` file owns → name the path and read it at runtime. A copy goes
  stale silently while the skill keeps citing it with confidence.
- rules that apply outside this task → `CLAUDE.md`
- background theory that changes no step → delete

**Freshness trigger:** the procedure changes, or a path in its reference set moves or is renamed.

**Test:** the `description` is a claim about *when this loads*. Too narrow and the skill never
fires; too broad and it fires on unrelated turns. It is the most expensive claim in the repo to
get wrong — re-check it whenever the skill's job changes.

**On length:** skills load on demand, so they can carry procedure `CLAUDE.md` can't afford.
Their length is bounded by the steps, not by a per-session budget.

### 3. `docs/*.md`

**Read when:** by link, when its subject comes up.

**Belongs:** exactly one owned subject, stateable in one line and registered in
[`ARCHITECTURE.md`](ARCHITECTURE.md)'s index · the durable rules for that subject and the *why*
behind them · the tables and taxonomies that subject needs.

**Doesn't belong:**

- another doc's subject → link to its owner
- the steps of a task → the skill that performs it
- unfinished intent → [`WORK-ITEMS.md`](WORK-ITEMS.md)
- setup instructions for humans → `README.md`

**Freshness trigger:** the thing it describes changes.

**Test:** can you say what this doc owns in one line, with no "and"? If not, it's two docs or
it's none.

### 4. `README.md` — root and nested

**Read when:** by a human, once, on arrival.

**Belongs (root):** what this is and who it's for · setup, including how to *acquire* each
config value · the everyday commands and what they do **not** do · pointers to
[`ARCHITECTURE.md`](ARCHITECTURE.md) and `CLAUDE.md`.

**Nested READMEs** are allowed only when a directory can't be understood from
[`ARCHITECTURE.md`](ARCHITECTURE.md)'s model. Scope it to that directory, and never repeat the
root README or a `docs/` file — orient and link.

**Doesn't belong:** conventions → `docs/` · system model → `ARCHITECTURE.md` · roadmap →
`WORK-ITEMS.md` · agent instructions → `CLAUDE.md`.

**Freshness trigger:** setup, configuration, or commands change. *Status* has no trigger — it
rots continuously, so keep it coarse or delete it.

**Test:** written for someone who has never seen this repo. A line that only helps someone who
already knows the project belongs in a different file.

### 5. Temporary files — `scratch/`

Working state for a task in flight: a plan, a migration checklist, review notes, an analysis too
long to sit in a message. Anything that must outlive a context window but not the task.

- **`scratch/` only, and it is gitignored.** Never committed, never elsewhere in the tree.
- **The first line states the deletion trigger** — the condition that makes the file garbage
  (*"delete when the auth migration lands"*). A temp file with no stated death condition becomes
  a permanent doc that nobody owns and nobody can trust.
- **Never linked from a durable doc.** A link into `scratch/` is a claim that dangles by design.
- **Never the source of truth.** It holds working state; the owning doc still owns the fact.
- **At task end every fact is promoted or dies with the file.** Promotion means into its owner
  per the routing table above. Deletion is the default, not the fallback.
- **Date-prefixed names**, so age shows in a listing ([`NAMING.md`](NAMING.md) owns the format).

**Test:** if this outlives the task, which doc should own it? Answer that at creation, not at
cleanup.

## Decision rule

Two questions, in order. **Who reads it, and when?** picks the surface. **What would falsify
it?** decides whether it's a claim to verify or a rule to keep. A fact that answers neither
doesn't belong in any `.md`.
