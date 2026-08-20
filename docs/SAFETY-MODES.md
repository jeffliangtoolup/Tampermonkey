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

**No *code* in this repo writes outside itself.** Neither userscript sends a request, submits a
form, or mutates a record: one reads a response ShipHawk itself requested, the other reads
rendered DOM and opens a window. The three writes they perform are local to the person running
them — the viewer's own `localStorage`, their clipboard, and the DOM of the page in front of them
— and all three are undone by a reload.

**The tooling is a different matter.** A session working in this repo holds the NetSuite MCP,
which reaches two live accounts, and that is a write path whatever the repo's own code does. It is
gated here rather than left to judgment:

| Integration | Gate | `local` mode? | Writes require | Cleanup handle |
|---|---|---|---|---|
| NetSuite MCP → **production** | `scripts/netsuite-mcp-guard.py` (`PreToolUse` on `mcp__netsuite__.*`) returns `deny` | n/a | **nothing — writes are never permitted** | n/a; the gate is that no write happens |
| NetSuite MCP → **sandbox (SB2)** | same guard returns `ask` | n/a | explicit per-call approval, every call | the sandbox itself — refreshed from production, so damage is bounded by the next refresh |
| NetSuite MCP → **either account, reads** | ungated by design | n/a | nothing | none needed |
| Both userscripts | none — no outbound write exists to gate | n/a | n/a | a page reload |

The guard is **default-deny in the sense this doc means**: it classifies a call it does not
recognize as a production write. A new write-capable tool on that server is therefore blocked
before anyone has reviewed it, rather than allowed until someone notices. The rule it enforces,
its one accepted gap (a `GET`-invoked RESTlet), and the procedure for removing it are owned by
[`../CLAUDE.md`](../CLAUDE.md) § HARD SAFETY RULES.

One caveat the userscript row should not be read as denying: **the page being mutated is
production.** No write leaves the browser, but a user acting on a mis-rendered order is a real
consequence — which is why both scripts are treated as live-only.

## What must never leave this repo

`origin` is a **public** GitHub repository, and it is not owned by this project's maintainer. That
single fact sets the rule: anything committed here is world-readable the moment it is pushed, and
unpushing does not unpublish it.

**Three classes never go into a tracked file.** The first two have mechanical detectors; the third
does not, and cannot.

| Class | Examples | Enforcement |
|---|---|---|
| **Credentials** | private keys, bearer/basic tokens, NetSuite token-id/secret and consumer-key/secret pairs, a ShipHawk API key, credentials embedded in a URL | `scripts/check-secrets.sh` via `.githooks/pre-commit` — the commit is refused |
| **Internal identifiers** | NetSuite account numbers, the `<digits>_SB<n>` sandbox realm, anything of the form *account 1234567* | same gate, patterns `netsuite-account-id` / `netsuite-sandbox-realm` |
| **Proprietary data** | customer or vendor names, order or margin figures, pricing, business rules, internal process detail, screenshots of live records | **judgment only — no detector exists** |

The detectors match **shapes, never literal values**: putting this account's number into the
pattern list would place that number in a tracked file, which is moving the leak rather than
closing it. That also means they catch the *next* account, not just this one.

**The third row is the one that will actually bite.** No regex recognizes a customer name or a
margin figure. Before committing, the question to ask about any concrete example, log excerpt,
error message, or record dump is: *would I be comfortable with a stranger reading this?* If the
answer is no, generalize it — "a sales order in a warehouse-assigned state" carries the same
technical meaning as a real order number and leaks nothing.

**Two directories are tracked but never pushed.** `netsuite-sb/` and `netsuite-prod/` hold SDF
slices — object names, script ids, field ids, deployment structure — which together describe the
internal shape of a live NetSuite account. They are versioned locally because that work deserves
history, and they never reach `origin`. `.githooks/pre-push` is the enforcement: it inspects the
commits in the push and refuses the whole push if any touches those paths.

Git has **no per-path push filter**, so this constrains the workflow rather than just the tooling:
a commit touching those directories makes its branch unpushable while it is in the range. Keep
NetSuite work on a branch that is never pushed. The hook is a backstop against forgetting, not a
substitute for that discipline. Both hooks arm together:

```bash
git config core.hooksPath .githooks
```

## Decision rule

If you can't name what undoes a write, it isn't `live`-eligible yet — it stays `local` until it
has a cleanup handle or a second gate.
