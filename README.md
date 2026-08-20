# Paccurate / ShipHawk Tampermonkey scripts

Two userscripts that add item images, UPC copying, and Paccurate pack-config access to the
ShipHawk TMS web UI for PCS Tools warehouse and shipping users, plus the NetSuite-side slices
that feed them. How it works lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); start
there.

## Setup

**Prerequisites:** a Chromium or Firefox browser with the
[Tampermonkey](https://www.tampermonkey.net/) extension installed (v5 or newer), and a ShipHawk
account with access to your tenant. Nothing else — no Node, no package manager, no build.

```bash
git clone https://github.com/jeffliangtoolup/Tampermonkey.git
cd Tampermonkey
git config core.hooksPath .githooks   # arms the commit-message and secret-scan hooks
```

Install a script: open the Tampermonkey dashboard → **Utilities** → **Import from file**, or
create a new script and paste the file's contents. `Show Images In ShipHawk.user.js` and
`paccurate images` are independent — install either or both.

### Configuration

There is no configuration file and no environment variable. Both scripts are configured by
editing the constants at the top of the file:

- **Which hosts a script runs on** — the `@match` lines in the userscript header. They currently
  cover `shiphawk.com` and every `*.myshiphawk.com` / `*.tms.myshiphawk.com` tenant subdomain.
- **Paccurate Config Editor target** — `URL_BASE` in `paccurate images`, pointing at
  `inspector.manage.paccurate.io/config-editor`.

`paccurate images` remembers its popup geometry and last pack UUID in the browser's
`localStorage` (`tmPaccuratePopupSize`, `tmPaccurateLastUuid`) — per-browser, and safe to clear.

## Running

There are no commands to run. A script is live the moment Tampermonkey has it enabled and you
load a matching ShipHawk page; the browser console logs confirm it fired.

Two things that are **not** automatic:

- **Updates.** Tampermonkey only offers an update when the script's `@version` header is higher
  than the installed one. Bump it in the same commit as any behavior change, or the change
  reaches nobody.
- **Verification.** Nothing in this repo executes either script. See
  [`CLAUDE.md`](CLAUDE.md) → *What the gate does not cover*.

## Running live

Live is the only mode these scripts have. Every host they match is a **production** ShipHawk
tenant and the Paccurate editor they open is the real one, so testing a change means acting on
real orders in a real session. Prefer read-only interactions, and never a bulk or scripted pass.
The NetSuite side is stricter still: no production deploy is ever run from this repo. Both rules,
and the rest of the perimeter, are owned by [`CLAUDE.md`](CLAUDE.md) → *HARD SAFETY RULES*, with
the mechanism in [`docs/SAFETY-MODES.md`](docs/SAFETY-MODES.md).

## Status

Both userscripts are in use. `Show Images In ShipHawk.user.js` is at v0.9 and `paccurate images`
at v0.19; the ShipHawk `@match` set was recently widened to cover all tenant subdomains. The
NetSuite slice homes (`netsuite-sb/`, `netsuite-prod/`) are scaffolded but empty. What's next is
owned by [`docs/WORK-ITEMS.md`](docs/WORK-ITEMS.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — **start here**: the system model and the
  index of which doc owns what.
- [`CLAUDE.md`](CLAUDE.md) — agent instructions: run commands, hard safety rules, conventions.

Git hooks (commit-message format + the staged-content secret gate) are wired by the
`core.hooksPath` command above; run it once per clone.
