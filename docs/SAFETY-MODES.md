# Safety modes

How every side-effecting integration is gated. This doc owns the **mode convention** — the
env-var shape, the three modes, and the rules that keep a live write deliberate. `CLAUDE.md`
→ HARD SAFETY RULES names *this project's* guarded paths and links here for the mechanism;
it does not restate the mechanism.

The aim: a fresh clone, a test run, and an unattended agent session all do nothing to the
outside world by default, and a real write takes a deliberate act by a human who is watching.

## The three modes

Every integration that writes anywhere outside this repo — a record in another system, an
email, a paid API call, a deploy — reads exactly one env var, `<INTEGRATION>_MODE`:

| Mode | Behavior | Credentials | Who uses it |
|---|---|---|---|
| `mock` | **The default.** Canned output, no network. | none | every clone, every test, every CI run, every agent session |
| `local` | Real payload, written to a **gitignored file** instead of the wire. | none | reading exactly what *would* be sent, without sending it |
| `live` | The real call. | required, and absent by default | a human, locally, watching, for this one run |

`local` is the mode that earns its keep: most "is the payload right?" questions get answered
without a single live call.

## Rules

- **One variable per integration, read in one place** — a `create<Thing>Client()` factory that
  returns the mock unless the mode says otherwise. Call sites never branch on the mode, so they
  can't be individually wrong about it.
- **Mock is the default in the code, not in the config.** An unset variable, a missing `.env`,
  a fresh clone → mock. Never "live if configured".
- **`live` requires its own credential** and fails closed without it — the mode alone cannot
  reach the network.
- **Never set a mode to `live` in tests, fixtures, CI, or any automated run.** The human flips
  it locally for one run. A `live` value committed to a config file or set in a CI environment
  is a bug, not a convenience.
- **An authorization covers one run.** A prior yes does not carry to the next question, the
  next session, or a second attempt after a failure.
- **Tests run against mocks, with no test-only branch in `src/`.** A test that needs a seam
  uses the same factory the app uses.
- **Interception is default-deny.** Where reads and writes share one endpoint — one URL, a
  dispatcher keyed by an `action` field — a test-time interceptor passes through an explicit
  **read allowlist** and intercepts everything else. A write deny-list silently admits every
  write added later. Expect the maintenance trap that comes with it: a newly added read action
  looks like a crash until it joins the allowlist, so document that where the allowlist lives.
- **Guards are structural, not advisory.** This doc is the *explanation*; the enforcement is a
  fixture, a middleware, or a startup check that **refuses** — a host allowlist that aborts on
  a non-sandbox target, a permission `deny` in `.claude/settings.json`. A rule the tooling
  enforces beats a rule the agent remembers.

## Rank channels by reversibility

Not every live write is equally bad, and the gate should scale with how hard the damage is to
undo.

| Rung | Example | What it needs *on top of* the mode gate |
|---|---|---|
| **Reversible, self-cleaning** | a record in a system you can delete | a **provenance marker** (label/tag + a banner in the body) and a **recorded cleanup query** that finds every record carrying it |
| **Reversible, manual** | a file, a branch, a deploy to a staging host | a documented undo and a stated blast radius |
| **Irreversible** | outbound email or messaging, a payment, a prod deploy — anything a person reads | a **second** gate, explicit confirmation every time, and a divert override (e.g. `MAIL_TO_OVERRIDE`) for smoke tests |

Two rules fall out of that table:

- **Never weaken a provenance guardrail to make a payload prettier.** The marker and banner are
  what make the cleanup query total; a record written without them is a record nobody can find.
- **A divert override is not a gate.** It narrows the audience of a live send; it does not make
  the send mocked.

## The secret gate

Modes keep credentials off the wire; the secret gate keeps them out of git.
`scripts/check-secrets.sh` scans **tracked** files for credential shapes and exits non-zero on
a hit, so it can gate a commit — `.githooks/pre-commit` runs it against staged content.

- **Tracked, agent-ingested surfaces are the ones that matter**: docs, instruction files,
  committed fixtures, generated boards. Gitignored scratch is out of scope by design.
- **A detector must be precise, not broad.** It runs over docs that *quote* credential
  patterns, so it matches on a plausible value, allows documented placeholders, and excludes
  itself. Tune `PATTERNS` at the top of the script; a false positive is a bug in the pattern.
- **The gate never echoes a secret** — it prints `path:line` and the pattern's label, nothing
  more.
- **A secret that reached git is compromised.** Rotate it first; cleaning the file second.
  Editing the file and calling it done is not a fix.

## This project's integrations

<!-- TODO(template): one row per integration that writes outside this repo. Add the row in the
     same commit that adds the integration — an ungated side effect is exactly the failure this
     doc exists to prevent. -->

| Integration | Env var | `local` mode? | `live` requires | Cleanup handle |
|---|---|---|---|---|
| *(none yet)* | | | | |

## Decision rule

If you can't name what undoes a write, it isn't `live`-eligible yet — it stays `local` until it
has a cleanup handle or a second gate.
