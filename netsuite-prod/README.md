# netsuite-prod — prod-side staging

The production (account `855722`) counterpart of each `../netsuite-sb/` slice: the objects and
files a prod deploy *would* carry, staged so the diff against sandbox is reviewable before anyone
acts on it. Same one-subdirectory-per-feature layout as the sandbox side, with a `project.json`
bound to the prod account — gitignored, never committed.

**No deploy is ever run from this repo.** Not `project:deploy`, not `file:upload`, not with a
passing sandbox test, not "just this once". Staging what a deploy would carry is this directory's
entire job; running it is a separate, deliberate act by a human elsewhere. See `../CLAUDE.md`
§ HARD SAFETY RULES.

Two more rules that bind this directory specifically:

- **Nothing here is authoritative.** Files are copies of account objects. The account is the
  truth; a change that matters is made in sandbox first and only then reflected here.
- **`/refactor` never targets this directory.** A convention-conformance pass would edit copies
  into disagreement with the objects they mirror, and their filenames are referenced by live
  deployment records. `/commit` *does* cover it — the files are tracked — so changes here land in
  commits like anything else.

Related and distinct: `../../Netsuite/netsuite-prod-mirror/` is the pull-only mirror of the whole
production account and is never written to from anywhere, and the workspace-level
`../../netsuite-prod/` is the workspace's own thin-project home, not this one.
