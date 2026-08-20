# Architecture

**Start here.** This doc owns the system model — the shape of the project and how the pieces
fit — and indexes which doc owns every other durable fact. If a fact has no owner listed here,
it doesn't have a home yet; give it one before writing it down twice.

## System model

### Top-level map

| Path | What it is |
|---|---|
| `Show Images In ShipHawk.user.js` | Userscript. Wraps `XMLHttpRequest.prototype.open` and, on ShipHawk's `ready-to-ship` views, reads the response of `POST /api/v4/orders/find` to inject item images, click-to-copy UPCs, and carrier logos into the rendered table. |
| `paccurate images` | Userscript. Reads Paccurate pack tags out of the *rendered DOM* (`svg[data-test-id^="remove-tag-icon-"]`, falling back to `.react-tagsinput .MuiChip-label`), derives a pack UUID, and opens/updates a named popup window onto the Paccurate Config Editor. SPA-aware and hotkey-driven. Its filename carries no `.user.js` extension — see `docs/WORK-ITEMS.md`. |
| `netsuite-sb/` | Sandbox (SB2) thin SDF slices for the NetSuite side of the integration. Own `README.md`. |
| `netsuite-prod/` | Prod-side staging copies of what a deploy would carry. No deploy runs from here. Own `README.md`. |
| `docs/`, `CLAUDE.md`, `.claude/`, `.githooks/`, `scripts/` | The convention set, the two local skills, and the two git hooks. |

There is no build, bundler, package manager, or server. The userscripts *are* the artifacts.

### How the pieces fit

Both scripts are injected by Tampermonkey into a ShipHawk page the user already has open, and
neither has a backend of its own:

- **`Show Images In ShipHawk.user.js`** is *interception*-shaped. It never issues a request; it
  monkey-patches XHR and reacts to traffic ShipHawk itself makes, which is what couples it to
  that endpoint's response shape and to the DOM it writes into.
- **`paccurate images`** is *scrape-and-launch*-shaped. It reads state only from what ShipHawk
  has rendered, then hands a `packUuid` query parameter to a Paccurate-hosted editor in a
  separate window. It talks to no API directly.

Each coupling is to a surface neither script owns — a third-party endpoint response, a
third-party DOM, a set of `data-test-id` attributes — so a silent upstream change is the expected
failure mode, not an exceptional one.

### State model

| State | Where it lives | Survives |
|---|---|---|
| Popup geometry (`tmPaccuratePopupSize`) | Browser `localStorage`, per origin | Reloads and restarts; per browser profile, never shared |
| Last pack UUID (`tmPaccurateLastUuid`) | Browser `localStorage` | Same |
| Popup window handle, current UUID | In-page JS, module scope | Nothing — rebuilt on every page load |

No server-side state, no cookies set, no cache written by either script.

### External services

| Service | Used for | Config / credentials |
|---|---|---|
| ShipHawk TMS (`*.shiphawk.com`, `*.myshiphawk.com`) | The host application both scripts run inside; source of the intercepted `orders/find` response | The user's own logged-in session. No key, no credential stored |
| Paccurate Config Editor (`inspector.manage.paccurate.io`) | The popup target for a pack UUID | None — `URL_BASE` in `paccurate images` |
| ShipHawk asset S3 bucket, and two third-party image hosts | Carrier logos and placeholder images, hot-linked | None |
| NetSuite (prod `855722`, sandbox `855722_SB2`) | The account the `netsuite-*/` slices target | Per-developer SDF auth ID in a gitignored `project.json` |

The two hot-linked non-ShipHawk image hosts (`i.pinimg.com`, `www.stickertalk.com`) are outside
anyone's control here and will eventually 404.

### Safety posture

Every path this project has is a live one — there is no staging ShipHawk tenant and no mock mode,
so the mode convention in [`SAFETY-MODES.md`](SAFETY-MODES.md) has nothing to gate on the
userscript side. The guarded paths are the NetSuite ones (no prod deploy from this repo, no write
to the pull-only prod mirror, sandbox-first, never commit a `project.json`) and they are enforced
by rule plus the `.gitignore` entries; the rules themselves are owned by
[`../CLAUDE.md`](../CLAUDE.md) → *HARD SAFETY RULES*.

### Tests and budgets

**There are none.** No test tree, no runner, no timeout table — a change is verified by loading
it in a browser against a real tenant. [`TESTS.md`](TESTS.md) records that posture and what it
leaves unproven; [`BUDGETS.md`](BUDGETS.md) stays empty until something in this repo bounds a
hop of its own.

## Doc index — which doc owns what

| Doc | Owns |
|---|---|
| `CLAUDE.md` | Agent workflow rules, run commands, hard safety rules, convention pointers. |
| `docs/ARCHITECTURE.md` | This doc — system model + doc index. |
| `docs/NAMING.md` | Naming conventions. |
| `docs/COMMENTS.md` | Comment conventions. |
| `docs/DOCS.md` | Which `.md` file owns which kind of information — `CLAUDE.md`, skills, `docs/`, READMEs, `scratch/` — plus the freshness, accuracy, and succinctness rules for all of them. |
| `docs/COMMITS.md` | Commit conventions. |
| `docs/SAFETY-MODES.md` | The mock/local/live mode convention, the reversibility ladder, the secret gate. |
| `docs/TESTS.md` | Test trees & runners, stable test IDs, known reds, coverage map. |
| `docs/BUDGETS.md` | Per-hop timeouts — value, reason, and expiry behavior. |
| `docs/ERRORS.md` | Error taxonomy — which remedy each class means, its codes, the message contract, derived failure tags. |
| `docs/WORK-ITEMS.md` | Agreed-but-unfinished work, deferred items with triggers, open questions, the decision log. |
| `docs/SUBAGENTS.md` | Subagent model-selection rubric. |
| `.claude/skills/refactor/SKILL.md` | The convention-conformance procedure — the post-generation self-check and the `/refactor` directory sweep. |
| `.claude/skills/commit/SKILL.md` | The `/commit` procedure — survey the tree, group per `docs/COMMITS.md`, apply approved groups. |
| `README.md` | Human setup and onboarding: what this is, how to install and configure it, the everyday commands. |
| `netsuite-sb/README.md` | What a sandbox slice is, how one is laid out, and how it is verified. |
| `netsuite-prod/README.md` | What the prod staging side is for, and the rules that bind it. |
| `.env.example` | The environment variables themselves — each name, its shape, and its per-variable notes. Never a real value. How to *acquire* each value is the README's. |
<!-- TODO(template): add a row for every new .md; one owner per fact. This table is the
     conformance boundary — docs/DOCS.md § Conformance carries the command that verifies it. -->
