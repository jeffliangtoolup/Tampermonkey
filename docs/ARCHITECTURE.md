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
| `netsuite-sb/` | Sandbox (SB2) thin SDF slices for the NetSuite side of the integration. Own `README.md`. **Tracked, never pushed** — see [`SAFETY-MODES.md`](SAFETY-MODES.md) → What must never leave this repo. |
| `netsuite-prod/` | Prod-side staging copies of what a deploy would carry. No deploy runs from here. Own `README.md`. **Tracked, never pushed.** |
| `docs/`, `CLAUDE.md`, `.claude/`, `.githooks/`, `scripts/` | The convention set, the two local skills, and the two git hooks. |

There is no build, bundler, package manager, or server. The userscripts *are* the artifacts.

### How the pieces fit

Both scripts are injected by Tampermonkey into a ShipHawk page the user already has open, and
neither has a backend of its own. They share no code and never interact.

**`Show Images In ShipHawk.user.js` — interception-shaped.** It issues no request of its own.
An IIFE closes over the original `XMLHttpRequest.prototype.open` and replaces it; every XHR the
page makes gets a `readystatechange` listener. The listener acts only when the URL contains
`ready-to-ship` **and** the response URL matches ShipHawk's `orders/find` endpoint, then waits
for the table to settle before rewriting it:

1. Removes its own previously injected `.test` node, so a re-render doesn't stack duplicates.
2. Computes the order margin — the `Gross Profit` entry in `reference_numbers` minus the summed
   `total_price` of every proposed shipment.
3. Walks `.MuiTableRow-root`, building a SKU→row index and attaching a click-to-copy handler to
   each UPC cell.
4. Injects `Description` and `Weight` header cells plus their body cells, per line-item SKU.
5. Parses each `order.description` as JSON and injects its `productImage` as a 100×100 thumbnail
   that expands to a fixed-position 500×500 on hover.
6. Appends a carrier logo, the shipping rate, a good/bad margin badge, and — when the service
   name contains `surepost` — a UPS SurePost warning.

**`paccurate images` — scrape-and-launch-shaped.** It reads state only from what ShipHawk has
rendered and talks to no API. Tags come from `svg[data-test-id^="remove-tag-icon-"]`, whose
attribute suffix is split at its last `-` to recover the tag, falling back to
`.react-tagsinput .MuiChip-label` text when no SVG is present. **The first tag is used verbatim
as the pack UUID** and handed to the Config Editor as `?packUuid=<tag>&embed=true`.

Staying current with a single-page app is most of the file:

- A `MutationObserver` on the tag container (or `document.body` as a last resort) re-reads tags
  on any subtree or text change, debounced.
- `history.pushState` and `replaceState` are monkey-patched, `popstate` is listened for, and a
  polling interval backstops both in case a route change slips past all three.
- The popup is a **named** window, so re-opening reuses the same one; a watcher samples its
  outer size and screen position and persists them, and a nudge re-applies the saved rect after
  navigation because browsers may ignore `window.open`'s feature string.
- Two hotkeys: **Alt+P** opens or focuses the popup for the last known UUID, **Alt+S**
  force-saves its current geometry for browsers that block live sampling.

Every coupling either script has is to a surface it does not own — a third-party endpoint's
response shape, a third-party DOM, a set of `data-test-id` attributes, generated CSS class names
— so a silent upstream change is the expected failure mode, not an exceptional one.

### Known fragility

Where each script will break first, and why. Nothing here is a bug report; both files are
grandfathered (`../CLAUDE.md` § Grandfathered files) and the actionable items live in
[`WORK-ITEMS.md`](WORK-ITEMS.md) § Open items.

| Coupling | Where | Why it's fragile |
|---|---|---|
| Exact-match on `https://shiphawk.com/api/v4/orders/find` | `Show Images`, the response-URL gate | String equality against the apex host only. A request served from a tenant subdomain does not match, so the script loads and then does nothing. |
| `.jss68` | `Show Images`, injected body cells | A JSS-generated class name. The number is assigned at build time and changes whenever ShipHawk rebuilds its styles. |
| `.MuiTableRow-root`, `.MuiTableCell-root`, `.MuiGrid-root`, `.MuiStep-alternativeLabel`, `.MuiTypography-body2` | `Show Images`, throughout | Material-UI internals. Any component upgrade on ShipHawk's side can rename or restructure them. |
| Positional cell indexes (`children[1]`, `children[2]`) | `Show Images`, the SKU/UPC scan | Column order is assumed, not detected. Inserting a column upstream silently shifts what gets read. |
| `carrierImgMap`'s six literal carrier names | `Show Images`, the order-info block | A carrier outside the map yields an `undefined` image source rather than a fallback. |
| `order.description` as JSON | `Show Images`, the image injection | A non-JSON description throws inside the listener; there is no guard around the parse. |
| `svg[data-test-id^="remove-tag-icon-"]`, `.react-tagsinput`, `[data-test-id="tags-select"]` | `paccurate images`, tag extraction | Test-id attributes are ShipHawk's, not ours, and carry no compatibility promise. |
| First tag == pack UUID | `paccurate images`, `refreshFromDom` | Any tag in the first position is passed to the editor as a UUID, whatever it actually is. |

### State model

| State | Where it lives | Survives |
|---|---|---|
| Popup geometry (`tmPaccuratePopupSize`) | Browser `localStorage`, per origin | Reloads and restarts; per browser profile, never shared |
| Last pack UUID (`tmPaccurateLastUuid`) | Browser `localStorage` | Same |
| Popup window handle, current UUID | In-page JS, module scope | Nothing — rebuilt on every page load |
| SKU→row index, injected DOM nodes | The rendered page | Nothing — discarded on re-render, and the script removes its own `.test` node before rebuilding |

No server-side state, no cookies set, no cache written by either script. The popup is addressed
by a fixed window name, which is what lets a second launch retarget the existing window instead
of stacking a new one — the only piece of cross-page-load continuity either script has beyond
`localStorage`.

### External services

| Service | Used for | Config / credentials |
|---|---|---|
| ShipHawk TMS (`*.shiphawk.com`, `*.myshiphawk.com`) | The host application both scripts run inside; source of the intercepted `orders/find` response | The user's own logged-in session. No key, no credential stored |
| Paccurate Config Editor (`inspector.manage.paccurate.io`) | The popup target for a pack UUID | None — `URL_BASE` in `paccurate images` |
| ShipHawk asset S3 bucket, and two third-party image hosts | Carrier logos and placeholder images, hot-linked | None |
| NetSuite (production and SB2 sandbox) | The accounts the `netsuite-*/` slices target. Account numbers are deliberately absent from this repo — see `SAFETY-MODES.md` → What must never leave this repo | Per-developer SDF auth ID in a gitignored `project.json` |

The two hot-linked non-ShipHawk image hosts (`i.pinimg.com`, `www.stickertalk.com`) are outside
anyone's control here and will eventually 404.

### Safety posture

Every path this project has is a live one — there is no staging ShipHawk tenant and no mock mode,
so the mode convention in [`SAFETY-MODES.md`](SAFETY-MODES.md) has nothing to gate on the
userscript side. The guarded paths are the NetSuite ones (no MCP write to production ever,
sandbox MCP writes only on explicit approval, no prod deploy from this repo, no write to the
pull-only prod mirror, sandbox-first, never commit a `project.json`). Several are enforced
mechanically rather than by memory: `scripts/netsuite-mcp-guard.py` inspects every
`mcp__netsuite__*` call and denies a production write outright, `.githooks/pre-commit` refuses a
commit carrying a credential or an internal identifier, `.githooks/pre-push` refuses any push
touching the two never-pushed slice homes, and the `.gitignore` entries keep a `project.json`
unstageable. The rules themselves are owned by
[`../CLAUDE.md`](../CLAUDE.md) → *HARD SAFETY RULES*; how the MCP gate works is owned by
[`SAFETY-MODES.md`](SAFETY-MODES.md) → *This project's integrations*.

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
