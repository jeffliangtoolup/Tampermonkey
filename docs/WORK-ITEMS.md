# Work items

What this project has agreed to do and hasn't done yet. [`ARCHITECTURE.md`](ARCHITECTURE.md)
owns what the code **is**; this doc owns what it **isn't yet** — the in-flight items, the
decisions already made, and the work deliberately deferred. Nothing here describes shipped
behavior, and nothing in `ARCHITECTURE.md` describes intent.

The aim: a session that opens cold can tell what's next, what's settled, and what's been
rejected — without re-deriving any of it or re-litigating a closed decision.

## Items

Each item carries a stable ID (`W1`, `W2`, …) so a commit, a doc, or a conversation can cite it.
**IDs are never reused** — a closed item's number retires with it.

<!-- TODO(template): grow this table as work is agreed. An item enters when it's DECIDED, not
     when it's imagined — a wish list rots and takes the doc's credibility with it. -->

| ID | State | Item | Done when |
|---|---|---|---|
| W1 | Deferred | Give `paccurate images` a real userscript filename (`*.user.js`), matching the other script. *Trigger:* the next change to that file, so the rename rides with work already touching it rather than as a standalone churn commit. *Scope:* the filename and any doc rows naming it — no edit to the script body, no change to its greasyfork `@downloadURL`/`@updateURL` pair. | The file is named `*.user.js` and every doc row citing it agrees |
| W2 | Deferred | Create the first `netsuite-sb/<feature>/` slice for the NetSuite side of the Paccurate/ShipHawk integration. *Trigger:* the NetSuite change is scoped — which records and fields feed the pack tags. *Scope:* the sandbox slice and its prod-side staging counterpart, both empty of objects until the feature is known. | A named slice exists in SB2 and its counterpart is staged in `netsuite-prod/` |

**States**, and what each one commits to:

| State | Means |
|---|---|
| **Now** | actively being built. Keep this list short enough to be true. |
| **Next** | agreed, scoped, unstarted — the thing to pick up without asking. |
| **Blocked** | agreed, but waiting on something named. A blocked item states *what* unblocks it, not just that it's blocked. |
| **Deferred** | agreed *not* to do yet, on purpose. Its row carries *Trigger:* (what must be true before it starts — a phase shipping, a second caller appearing, a number crossing a threshold) and *Scope:* (how far the fix goes) **inline**. Missing the trigger, it's an item nobody picks up; missing the scope, it's one somebody half-does. |

An item that needs more than a row gets a subsection under **Detail**, and anything with real
design substance gets its own doc — this table then links to it rather than absorbing it.

## Detail

<!-- TODO(template): one subsection per item that needs more than its row — goal, why now (or
     why not), blast radius, exit condition, and a link to the doc that owns its design. For a
     Deferred item the "why not" is the load-bearing part: "it perturbs a production path for
     zero behavior change" is a reason; "low priority" is not. -->

*(nothing yet)*

## Open items

Questions that must be answered before the affected work can proceed — each with who or what
answers it.

**Say "none" out loud when it's true.** An empty section is a fact worth stating ("none — all
design questions resolved"); a *deleted* section reads as an oversight.

- **Do the two hot-linked non-ShipHawk placeholder images need self-hosting?**
  `Show Images In ShipHawk.user.js` hot-links a Pinterest CDN image and a stickertalk.com JPG as
  fallback/decoration. Both are outside anyone's control here and will eventually 404, silently.
  Answered by: Jordan — either accept the eventual breakage, or replace them with assets we host.

## Decision log

Numbered, one entry per decision, so anything can cite `#4`. This is the record that stops a
settled question from being reopened every session.

- **Revise in place, dated** — when a decision changes, edit its entry and mark the change
  (*"revised 2026-08-04: …"*) rather than appending a contradicting entry. Two entries that
  disagree make the log useless exactly when it's consulted.
- **Record rejected alternatives with their reason**, dated. The reason is what prevents the
  rejected option from being re-proposed as a fresh idea.
- **Dates are absolute** (`2026-08-04`), never relative — "last week" means nothing to the
  session that reads this in three months.
- A decision that constrains *code* belongs to the doc that owns that code; log the decision
  here and link. The log records **what was decided and why**, not how it works now.

<!-- TODO(template): number entries from 1 and never renumber. -->

| # | Decision |
|---|---|
| 1 | **2026-08-20** — The `project-template` convention set is instantiated at **this repo's root**, and the NetSuite feature slices carry no `docs/` of their own. *Rejected:* a copy per slice — duplicate convention copies drift, and a slice is disposable while the conventions are not. |
| 2 | **2026-08-20** — `/commit` and `/refactor` are **full local copies** of the template skills, not pointers to the workspace-level definitions at `../.claude/skills/`. *Reason:* this repo has its own git remote and must keep working when cloned on its own. *Accepted cost:* upstream improvements to the workspace copies do not arrive here automatically. |
| 3 | **2026-08-20** — The NetSuite side of this integration lives in **this repo's own** `netsuite-sb/` and `netsuite-prod/`; the workspace-level homes of those names are never written to. Both homes were created with a `README.md` and nothing else. *Rejected:* seeding a first feature pair immediately — no feature is scoped yet (see W2), and a pre-made slice named for nothing is what stops slices being per-feature. |
| 4 | **2026-08-20** — `/refactor` never targets `netsuite-prod/`; `/commit` does cover it. *Reason:* staged files there mirror production account objects, so conformance-editing them creates divergence, but they are tracked and must be committable. |
| 5 | **2026-08-20** — No production NetSuite deploy is ever run from this repo, and `../Netsuite/netsuite-prod-mirror/` is never written to. Recorded in `CLAUDE.md` § HARD SAFETY RULES; the gitignored `project.json` entries are the one mechanical part. |

## Freshness

[`DOCS.md`](DOCS.md) owns the general rules (update in the falsifying commit, verify or delete,
no history sections). What's specific to this doc:

- **An item closes in the same commit that finishes it**, and its row leaves the table. Its
  outcome moves to whichever doc owns the behavior it created — usually
  [`ARCHITECTURE.md`](ARCHITECTURE.md).
- **A session's task list is not this doc.** Ephemeral, in-session steps live in the task tool;
  what lands here is durable intent that outlives the session.

## Decision rule

If the item is agreed and unfinished, it belongs here. If it's finished, it belongs in the doc
that owns the behavior. If it isn't agreed, it doesn't belong in either.
