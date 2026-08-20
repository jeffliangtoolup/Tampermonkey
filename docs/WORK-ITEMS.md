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
| W1 | Deferred | Give `paccurate images` a real userscript filename (`*.user.js`), matching the other script. *Trigger:* **revised 2026-08-20** — the first change that alters that script's behavior or reshapes its structure, i.e. the moment it leaves grandfathered status (decision #6, which owns the threshold). A `@version` bump, an `@match` edit, or a comment change is explicitly *not* the trigger. *Scope:* the filename and any doc rows naming it — no edit to the script body, no change to its greasyfork `@downloadURL`/`@updateURL` pair. | The file is named `*.user.js` and every doc row citing it agrees |
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

Each item below is something reading the two scripts surfaced on 2026-08-20. **None is being
fixed** — both files are grandfathered (`../CLAUDE.md` § Grandfathered files), so these are
recorded to be triaged, and the first one is the reason this section leads with a functional
question rather than a cosmetic one.

- **Does `Show Images In ShipHawk.user.js` actually work on tenant subdomains?** Its response-URL
  gate is an exact string comparison against `https://shiphawk.com/api/v4/orders/find`, so an
  `orders/find` call served from `*.tms.myshiphawk.com` should not match and the script should do
  nothing there. Commit `ee6caa6` widened `@match` to cover those hosts, which loads the script
  but cannot make the gate pass. If that reading is right, the widening had no effect and the fix
  is a host-agnostic test on the URL's path. Answered by: Jordan — confirm against a tenant
  session before anyone treats the widening as done.
- **Do the two hot-linked non-ShipHawk placeholder images need self-hosting?** The margin badge
  hot-links a Pinterest CDN image and a stickertalk.com JPG. Both are outside anyone's control
  here and will eventually 404, silently. Answered by: Jordan — accept the eventual breakage, or
  replace them with assets we host.
- **Should the unknown-carrier case have a fallback image?** `carrierImgMap` covers six carriers;
  anything else renders `src="undefined"` — a broken image rather than a missing one. Answered
  by: Jordan.
- **Is the truncated SurePost warning intentional?** The injected message ends *"Please use one of
  following boxes:"* with no list following it. Either the list was lost or it was never written.
  Answered by: Jordan.
- **Which of `paccurate images`' two `readTags()` definitions is meant to survive?** It is defined
  twice with identical bodies (once among the tag-extraction helpers, once among the SPA hooks);
  the later definition wins and the earlier is dead. Cosmetic today, a trap the moment the two
  stop being identical. Answered by: Jordan, whenever that file next moves.
- **Should the script's own identity be reconciled?** `paccurate images` describes itself three
  ways: its `@name` says "Tag reader + SPA-aware iframe" (it uses a popup, not an iframe), its
  greasyfork `@downloadURL`/`@updateURL` name script 554919 "(Popup window)", and the repo file
  has no extension. Answered by: Jordan — worth settling in the same pass as W1.

Two more observations that need no answer and are recorded where they belong instead: the
`currId` dedupe in `Show Images` can never fire across requests (`var currId` is re-declared per
patched `open` call), and `@match` line 8 pins `fswtu.tms.myshiphawk.com` which line 9's wildcard
already covers. Both are noted in [`ARCHITECTURE.md`](ARCHITECTURE.md) § Known fragility.

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
| 6 | **2026-08-20** — Both userscripts are **grandfathered** out of every naming and coding convention, and out of any future file rename or directory reorganization, **per file**, until that file's first change that alters behavior or reshapes structure. A `@version` bump, an `@match` edit, a constant tweak, or a comment change does not end it. When it does end, the file is renamed to `*.user.js` and only the code the change touches is brought to convention. *Reason:* both scripts predate the conventions and work in production; a conformance rewrite would put a large untested diff through files that have no test coverage and no staging tenant. *Rejected:* ending the exemption on any edit at all — it would make a one-line `@version` bump trigger a full rewrite, which is how a version bump stops happening. `CLAUDE.md` § Grandfathered files owns the rule; `.claude/skills/refactor/SKILL.md` enforces it. |

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
