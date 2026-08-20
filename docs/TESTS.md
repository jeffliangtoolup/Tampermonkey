# Tests

Conventions for this project's test suites: how they're organized, what they're allowed to
touch, how a test is referenced by a stable ID, and what to do with a test that fails because
the *app* is wrong. The system model lives in [`ARCHITECTURE.md`](ARCHITECTURE.md), whose doc
index points here; this doc owns the test layer's own facts.

## Trees and runners

**There is no test tree and no runner in this repo**, and that is the current posture rather
than an omission waiting to be filled: both deliverables are userscripts that only exist inside
a live ShipHawk page, and the NetSuite slices only execute inside a NetSuite account.

| Tree | Runner | Command | Notably excluded |
|---|---|---|---|
| *(none)* | — | — | everything below |

What that leaves unproven — every item confirmed only by a human, in a browser or in SB2:

- That either userscript **parses and runs at all** after an edit.
- That the `@match` set still covers the tenant hosts users are actually on.
- That `Show Images In ShipHawk.user.js` still recognizes the `orders/find` response shape and
  the DOM it injects into — both owned by ShipHawk and changed without notice.
- That `paccurate images` still finds its tags (`data-test-id` attributes and MUI chip labels are
  ShipHawk's markup, not ours) and that the Config Editor still accepts a `packUuid` parameter.
- That anything under `netsuite-sb/` deploys, or behaves as intended once deployed.

A convention-conformance sweep (`/refactor`) and the two git hooks are the only automatic checks
that exist, and none of them executes project code. When a test layer does appear, everything
below this section already governs it — the ID scheme, the mock posture, and the known-red rules
were not written for a suite that exists yet.

## What tests may touch

Tests run against **mocks** — the mode convention is owned by
[`SAFETY-MODES.md`](SAFETY-MODES.md). Concretely:

- **No test sets a mode to `live`**, and no test needs a credential to pass.
- **No test-only branch in `src/`.** A test that needs a seam uses the same factory the app uses.
- A suite that creates real state in a sandbox is **separate and tagged**, excluded from the
  default command, guarded by a check that refuses a non-sandbox target, and responsible for its
  own cleanup.
- Tests leave the tree clean: generated artifacts land in gitignored paths.

## Stable test IDs

Every test carries a **stable short ID** — a per-file letter prefix plus a number from 1 (`A1`,
`A2`, … / `B1`, …) — so any test can be cited from a commit message, a doc, or a bug report
without quoting its title. This doc owns the scheme; [`COMMITS.md`](COMMITS.md) § Referencing
tests owns how a commit cites one.

- **Prefixes are unique across every test tree**, not per directory. Two trees both starting at
  `A` make `A3` ambiguous exactly when you need it most. With more than one tree, width-code the
  prefix by tree (single letter for one, double for another) so the ID names its tree.
- **The ID goes in the test title** (`test('A3: an expired token is rejected')`) so it shows up
  in runner output, and any renumbering is visible in the diff.
- **Numbers are never reused.** A deleted test's number retires with it; the next test takes the
  next free number. Reusing one silently invalidates every existing reference.
- **Enforce the scheme with a meta-test.** One test file that reads the suite's own titles and
  fails on a missing prefix, a duplicate ID, or one prefix claimed by two files. A convention
  checked by a test is a convention; one checked by memory is a wish. Give the meta-test IDs too.
  **Its scan reach is the whole enforcement.** A meta-test reads the directories it was told to
  read, so a suite placed anywhere else — a second tree, or a test sitting beside the source it
  covers — is invisible to it and silently unenforced, precisely for the newest code. Adding a
  tree means extending the scan **in the same change**, alongside width-coding its prefix.

## Known reds — tests that fail because the app is wrong

A **known red** is a test that fails because the code under test is missing or breaking a
behavior it should have: the test is right and the app is wrong. It is not a broken test, not a
flake, and not a candidate for adjustment.

- **Never edit a known red to pass**, never delete it, and never fold it into an accepted
  baseline. Its failure *is* the report.
- **Keep the set explicit** — a named list of IDs (`KNOWN_RED_IDS`) with a one-line premise
  each, not a habit of ignoring familiar red output.
- **Alarm on the inverse.** A check that fires when a known red starts **passing** is the
  valuable half: it means someone may have fixed the app. Surface it, confirm the fix, then
  remove the ID and let the test hold the line normally.
- **Distinguish it from a flake.** A flake fails intermittently on unchanged code — that's a
  test defect, fixed or quarantined with a stated reason, not recorded here.

## Coverage

<!-- TODO(template): grow this table as suites appear — one row per area, naming the files that
     cover it. This is the map a session reads to find whether a behavior is already covered
     before writing a duplicate test. -->

| Area | Files |
|---|---|
| *(nothing covered — see Trees and runners)* | |

## Decision rule

If a failing test's fix belongs in `src/`, it's a known red — record it and leave the test
alone. If the fix belongs in the test, fix the test. Deciding which is the whole job; "make it
green" is not a decision.
