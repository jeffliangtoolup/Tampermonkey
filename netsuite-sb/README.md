# netsuite-sb — sandbox slices

The sandbox (SB2, account `855722_SB2`) side of the NetSuite work behind these userscripts. One
subdirectory per feature, each a self-contained thin SDF project:

```
netsuite-sb/<feature>/
  src/            SDF objects and files — only what this feature touches
  src/manifest.xml
  src/deploy.xml
  project.json    per-developer auth ID for SB2 — gitignored, never committed
  suitecloud.config.js
```

**Empty is a normal state.** A slice is created when work on that feature starts and removed when
it lands; nothing here is a long-lived home for account objects. Name a slice for the *feature*,
in kebab-case — `pack-tag-sync`, not `salesorder` or a ticket number — because a record-shaped
name invites the next unrelated change to be dropped in, which is how a thin slice stops being
thin.

**This is where a NetSuite change is written and verified**, per `../CLAUDE.md` § HARD SAFETY
RULES: sandbox first, always. Deploying a slice here targets SB2 and only SB2. Verification
happens *in the account* — nothing in this repo executes SuiteScript.

Scope for the local skills: this directory is in scope for both `/commit` and `/refactor`. The
convention docs a slice is judged against are the ones at this repo's root (`../docs/`) — slices
carry no `docs/` of their own, by design, so there is exactly one copy of each convention.

The prod-side counterpart is `../netsuite-prod/`; the workspace-level `../../netsuite-sb/` is a
different thing entirely and off limits.
