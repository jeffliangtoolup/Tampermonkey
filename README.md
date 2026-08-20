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
create a new script and paste the file's contents. The two are independent — install either or
both:

| Script | What you get |
|---|---|
| `Show Images In ShipHawk.user.js` | On the ready-to-ship view: product thumbnails that enlarge on hover, `Description` and `Weight` columns, click any UPC to copy it, and a header badge showing the carrier logo, the shipping rate, and the order's margin. Warns when UPS SurePost is the selected service. |
| `paccurate images` | Opens the Paccurate Config Editor in a popup for the pack tag on the page, and keeps it pointed at the right pack as you navigate. The popup remembers its size and position between sessions, including on a second monitor. |

### Hotkeys — `paccurate images`

| Key | Does |
|---|---|
| **Alt + P** | Open the popup, or focus it if it's already open, for the most recent pack UUID. Says so if no tag has been seen yet. |
| **Alt + S** | Force-save the popup's current size and position. Use this if the popup keeps reopening in the wrong place — some browsers block the live position tracking, and this writes it explicitly. |

If your browser blocks the popup, the script tells you and copies the URL to your clipboard so
you can paste it into a tab yourself.

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

Both userscripts are in use — `Show Images In ShipHawk.user.js` at v0.9, `paccurate images` at
v0.19 — and both are **grandfathered out of this repo's conventions** until each next changes
substantially ([`CLAUDE.md`](CLAUDE.md) § Grandfathered files).

One caveat worth knowing before you rely on it: the `@match` set was recently widened to cover all
ShipHawk tenant subdomains, but `Show Images` gates on an exact apex-host endpoint URL, so it may
still do nothing on a tenant subdomain. That is unconfirmed and is the first open item in
[`docs/WORK-ITEMS.md`](docs/WORK-ITEMS.md).

The NetSuite slice homes (`netsuite-sb/`, `netsuite-prod/`) are scaffolded but empty. What's next
is owned by [`docs/WORK-ITEMS.md`](docs/WORK-ITEMS.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — **start here**: the system model and the
  index of which doc owns what.
- [`CLAUDE.md`](CLAUDE.md) — agent instructions: run commands, hard safety rules, conventions.

Git hooks (commit-message format + the staged-content secret gate) are wired by the
`core.hooksPath` command above; run it once per clone.
