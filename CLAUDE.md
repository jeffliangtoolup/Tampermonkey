# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

Two Tampermonkey userscripts that add capability to the **ShipHawk TMS web UI** for PCS Tools
warehouse users, plus the NetSuite-side changes that feed them. `Show Images In ShipHawk.user.js`
patches `XMLHttpRequest.prototype.open` and reacts to ShipHawk's own `orders/find` response,
injecting item images, Description/Weight columns, click-to-copy UPCs, carrier logos, and an
order-margin badge into the ready-to-ship view; `paccurate images` runs at
`@run-at document-start`, reads Paccurate pack tags off the rendered DOM, and drives a persistent
popup window onto the Paccurate Config Editor with hotkeys and remembered geometry. Both run in
the browser against live ShipHawk tenants — there is no build step and no server. The `netsuite-sb/` and
`netsuite-prod/` directories hold this project's own thin SDF slices for the NetSuite side of the
integration; see `docs/ARCHITECTURE.md`.

> **System model & doc index — start at [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).**

## Workflow

Before making any file edits, show me all the changes that will be made before asking me to
approve those changes.

**Before creating or editing any `.md` file** — this one, a skill, a `docs/` file, a README —
read [`docs/DOCS.md`](docs/DOCS.md) and route each fact to the file that owns it. Every durable
`.md` in this repo has a row in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)'s doc index and
is bound by those rules. An `.md` that isn't indexed belongs in `scratch/` with a deletion
trigger on its first line, or it doesn't belong in the repo.

## Commands

There is no package manager, build, bundler, or test runner in this repo. The userscripts are
the deliverable, edited in place and loaded into Tampermonkey by hand — human install steps are
the README's.

```bash
git config core.hooksPath .githooks   # once per clone — arms both hooks below
sh scripts/check-secrets.sh           # secret gate over tracked files (the hook runs it staged)
```

The one non-obvious bit: a userscript's `@version` header is what makes Tampermonkey offer an
update, so a behavior change that ships without bumping it silently reaches nobody.

### What the gate does not cover

**There is no automated gate on behavior here.** The two git hooks check a commit *subject's*
format and scan staged content for credential shapes — neither one executes a single line of
either userscript. Nothing in this repo verifies that a script still parses, still matches the
right ShipHawk hosts, still finds the DOM nodes and XHR endpoints it hooks, or still renders
anything. Every one of those is confirmed only by loading the script in a browser against a real
tenant. The same is true of anything under `netsuite-sb/` — a slice there is verified in SB2, not
here. Coverage is owned by [`docs/TESTS.md`](docs/TESTS.md).

## HARD SAFETY RULES



The mechanism behind those rules — the `<INTEGRATION>_MODE` convention, the reversibility
ladder, and the secret gate — is owned by [`docs/SAFETY-MODES.md`](docs/SAFETY-MODES.md). Rules
here name *this project's* guarded paths and link there; they don't restate the mechanism.

- **Never deploy to NetSuite production from this repo.** `suitecloud project:deploy` and
  `file:upload` are never run against a production account here, with or without a passing
  sandbox test. `netsuite-prod/` exists to *stage* what a prod deploy would carry, and the deploy
  itself is run elsewhere, deliberately, by a human.
- **Never write to `../Netsuite/netsuite-prod-mirror/`.** It is a pull-only mirror of the
  production account, refreshed by importing *from* the account; its filenames are referenced by
  live deployment objects. Read it freely, edit it never.
- **Never write into the workspace-level `../netsuite-sb/` or `../netsuite-prod/`.** Those are the
  homes for the workspace's own thin projects. This project's NetSuite work lives in *its own*
  `netsuite-sb/` and `netsuite-prod/`, inside this repo, and nowhere else.
- **Sandbox first, always.** A NetSuite change is developed and verified in SB2 (`netsuite-sb/`)
  before its prod-side counterpart is staged. Never the reverse order.
- **Never commit a `project.json`.** It carries a per-developer SDF auth ID; committing one
  pushes your account binding onto everyone else, and a wrong binding aims a deploy at the wrong
  account. `.gitignore` is the mechanical guard.
- **The userscripts have no test tenant.** Every host they match is a live ShipHawk production
  tenant, and the Paccurate Config Editor they open is the real one. Verifying a change means
  acting on production data in a real browser session — read-only interactions where possible,
  and never a bulk or scripted pass.

## Grandfathered files

Both userscripts predate every convention in this repo, and they are **deliberately exempt from
them** until each one is next changed substantially. This is a standing decision
(`docs/WORK-ITEMS.md` #6), not a backlog item:

| File | Status |
|---|---|
| `Show Images In ShipHawk.user.js` | Grandfathered |
| `paccurate images` | Grandfathered — including its missing `.user.js` extension |

**What the exemption covers.** Naming ([`docs/NAMING.md`](docs/NAMING.md)), comments
([`docs/COMMENTS.md`](docs/COMMENTS.md)), and every other code-style rule in `docs/` simply do
not apply to these two files. `/refactor` never targets them, in either mode. Any future
reorganization of this repo — new directories, renamed files — **leaves them where and as they
are**, extensionless filename included. Reading them and finding a convention violation is not a
finding; it is the expected state.

**What it does not cover.** The secret gate still scans them, commits that touch them still
follow [`docs/COMMITS.md`](docs/COMMITS.md), and § HARD SAFETY RULES binds them absolutely —
these are the files that touch live production tenants, so the exemption is about *style*, never
about safety.

**When it ends — per file, independently.** A file leaves grandfathered status on the first
change that **alters its behavior or reshapes its structure**: adding, removing, or reworking a
function, or changing what the script does. Explicitly *not* triggers: an `@version` bump, an
`@match` edit, a constant tweak, or a comment change — those may be made freely with the
exemption intact.

At that point, and only for the file that changed: rename it to `*.user.js` if it isn't already,
and bring **the code the change touches** to convention. The untouched remainder of the file
stays as it is — a behavior change is not a licence to rewrite the whole script, and a diff that
mixes the two is exactly what [`docs/COMMITS.md`](docs/COMMITS.md) tie-breaker 1 forbids.

Known convention and correctness debt inside both files is recorded as open items in
[`docs/WORK-ITEMS.md`](docs/WORK-ITEMS.md) — record what you notice there rather than fixing it
in passing.

## Conventions

- Naming: [`docs/NAMING.md`](docs/NAMING.md)
- Comments: [`docs/COMMENTS.md`](docs/COMMENTS.md)
- Markdown (which file owns what): [`docs/DOCS.md`](docs/DOCS.md) — bound by the Workflow rule
  above.
- Commits: [`docs/COMMITS.md`](docs/COMMITS.md)
- Safety modes for anything that writes outside this repo:
  [`docs/SAFETY-MODES.md`](docs/SAFETY-MODES.md) — mock by default, `live` never in tests or CI.
- Tests (trees, stable IDs, known reds): [`docs/TESTS.md`](docs/TESTS.md)
- Budgets & deadlines: [`docs/BUDGETS.md`](docs/BUDGETS.md)
- Errors — which remedy each class means, its codes, the message contract, derived failure tags:
  [`docs/ERRORS.md`](docs/ERRORS.md) (how the names are *formed* is in `docs/NAMING.md`).
- Ongoing work, deferred items, and the decision log:
  [`docs/WORK-ITEMS.md`](docs/WORK-ITEMS.md) — it owns what isn't built yet;
  `docs/ARCHITECTURE.md` owns what is.
- Subagent model selection: [`docs/SUBAGENTS.md`](docs/SUBAGENTS.md) — set `model` explicitly
  on every spawn.
- `/refactor` (`.claude/skills/refactor/SKILL.md`) enforces these docs: automatically on code
  Claude just wrote, and as an on-demand directory sweep. **`netsuite-prod/` is excluded** (see
  § Where this project sits) and **so are both userscripts** (see § Grandfathered files).
- `/commit` (`.claude/skills/commit/SKILL.md`) groups working-tree changes into small-to-medium
  commits per `docs/COMMITS.md`; a format-only `.githooks/commit-msg` gate backs it up (enable
  once per clone: `git config core.hooksPath .githooks`).
- The same hook path arms `.githooks/pre-commit`, which runs `scripts/check-secrets.sh` over
  staged content and refuses a commit carrying a credential
  ([`docs/SAFETY-MODES.md`](docs/SAFETY-MODES.md) → The secret gate).

## Where this project sits

This repo lives inside the `NS-Dev-Projects` workspace but is **its own project and its own git
remote**, and it is self-contained: `/commit` and `/refactor` here are **full local copies**, not
pointers to the workspace-level definitions, so they keep working if this tree is ever cloned on
its own. The convention set they read is the one at *this* root — there are no fallbacks to
resolve and no other tree's docs are ever read for a rule.

The NetSuite side of this integration is developed in slices under this repo:

| Directory | What it is | Skill scope |
|---|---|---|
| `netsuite-sb/` | Sandbox (SB2) SDF slices — where a NetSuite change is written and verified. | In scope for `/commit` and `/refactor`. |
| `netsuite-prod/` | Prod-side staging copies of what a deploy would carry. No deploy is ever run from here. | In scope for `/commit` (it is tracked); **never a `/refactor` target** — these files mirror account objects, and conformance-editing them makes them diverge from the account they mirror. |

Each home owns its own `README.md`; the workspace-level `../netsuite-sb/` and `../netsuite-prod/`
are a different thing entirely and off limits (see § HARD SAFETY RULES).

## Canonical-doc ownership

Every durable fact lives in exactly **one** doc; everything else links to it. Before writing a
fact into a comment, a README, or a second doc, find its owner — if it has one, link; if it
doesn't, give it one. `docs/ARCHITECTURE.md` indexes which doc owns what.

## Deeper docs

<!-- TODO(template): grow this index as docs appear. One line each: path — what it owns. -->

- `docs/ARCHITECTURE.md` — **start here**: the system model + the index of which doc owns what.
- `docs/NAMING.md` — naming conventions for new code.
- `docs/COMMENTS.md` — comment conventions (what to keep/remove, style, TODOs, freshness).
- `docs/DOCS.md` — the routing table for every `.md`: what belongs in `CLAUDE.md`, a skill, a
  `docs/` file, a README, or `scratch/` — and the freshness/accuracy/succinctness rules.
- `docs/COMMITS.md` — commit conventions (subject type-prefix, grouping rules, body beats).
- `docs/SAFETY-MODES.md` — how side-effecting integrations are gated (mock/local/live), the
  reversibility ladder, and the secret gate.
- `docs/TESTS.md` — test trees, stable test IDs and their meta-test, known reds.
- `docs/BUDGETS.md` — per-hop timeouts: the value, the reason, and what expiry does.
- `docs/ERRORS.md` — the error taxonomy: one class per remedy, codes per situation, the
  `TOKEN[code] — detail` message contract, and how observed failures get classified.
- `docs/WORK-ITEMS.md` — work items (now/next/blocked/deferred), open questions, and the
  numbered decision log with its rejected alternatives.
- `docs/SUBAGENTS.md` — subagent model-selection rubric.
- `README.md` — human setup/onboarding.
- `netsuite-sb/README.md` — what a sandbox slice is, how one is laid out, and how it is verified.
- `netsuite-prod/README.md` — what the prod staging side is for, and the rules that bind it.
