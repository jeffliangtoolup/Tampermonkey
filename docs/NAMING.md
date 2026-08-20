# Naming conventions

Conventions for new code. TS/JS-flavored — for other languages, keep the *rules* (booleans,
verb prefixes, sortable dates) and swap the case style for the language's idiom. As real code
appears, replace the generic examples with real ones from this repo so each rule stays
grounded. <!-- TODO(template): swap in real examples -->

**Both userscripts are exempt from this doc** until each next changes substantially — the trigger
and its scope are owned by [`../CLAUDE.md`](../CLAUDE.md) § Grandfathered files. Where a rule
below already has a matching example in one of them, it is cited as *precedent to follow*, not as
a claim that the file conforms: `paccurate images` mixes 2-space and 4-space indentation, defines
`readTags()` twice, and shadows `DEFAULTS.width`/`.w` between two shapes of the same rect;
`Show Images In ShipHawk.user.js` is `var`-scoped throughout, nests four named functions inside a
`setTimeout` callback, and uses `snake_case` where it mirrors ShipHawk's own JSON field names.

- **camelCase** — variables, functions, and `let`/`const` declarations.
  *e.g.* `readTags()`, `getSavedRect()`, `currentUuid`, `popupRef`, `tagObserver`.
  **Except when mirroring an external payload**: a field read straight off ShipHawk's JSON keeps
  that payload's spelling (`order_line_items`, `proposed_shipments`, `reference_numbers`,
  `total_price`), because renaming it costs a reader the ability to grep the response for it.
- **PascalCase** — classes, interfaces, and types.
  *e.g.* `class OrderService`, `interface RetryPolicy`, `type ParseResult`. Neither script
  declares one today; both are plain-function IIFEs.
- **UPPER_SNAKE_CASE** — constants and enum values.
  *e.g.* `URL_BASE`, `POP_NAME`, `SIZE_KEY`, `LAST_UUID_KEY`, `HOTKEY_OPEN`, `AUTO_FOCUS` — the
  block at the top of `paccurate images` is the precedent for new code, including the practice of
  naming a `localStorage` key rather than inlining the string at both the read and the write.
- **Boolean names** — prefix with `is`, `has`, `should`, or `can`.
- **Function names** — use a verb prefix where applicable: `get`, `set`, `fetch`, `handle`,
  `on`, `go`, `expect`, `build`, `parse`. Pick a small verb vocabulary early and stay
  consistent (e.g. all navigation helpers `go*`, all assertion helpers `expect*`). The existing
  vocabulary worth extending rather than replacing: `get*` for a pure read (`getSavedRect`,
  `getTagsFromSvgs`), `read*` for a read that picks between sources (`readTags`), `save*` for a
  persist (`saveRect`), `add*` for a DOM injection (`addHeaderRow`, `addBodyRow`, `addOrderInfo`),
  `observe*`/`install*` for anything that attaches a listener and leaves it running
  (`observeTagArea`, `installRouteHooks`), and `start*`/`stop*` as a matched pair around an
  interval (`startGeometryWatcher`/`stopGeometryWatcher`).
- **File names — kebab-case where applicable.**
  - **kebab-case** for modules and scripts: `order-service.ts`, `parse-config.ts`.
  - **`*.user.js` for a userscript**, since Tampermonkey and greasyfork both key install
    behavior off that suffix. Neither existing script is a model here — one is
    `Show Images In ShipHawk.user.js` (spaces, Title Case) and the other has no extension at all
    — and both keep their names under the grandfather clause above. New scripts get
    `kebab-case.user.js`.
  - **PascalCase** only where the filename mirrors a one-class-per-file exported class *and*
    that's the established pattern for that folder (e.g. page objects, React components).
    A single class export does **not** by itself promote a file to PascalCase — files stay
    kebab-case alongside their kebab-case peers.
- **Error class names** — three rules, in priority order:
  - **Name the fault category, never the symptom** — `RunConfigError`, not
    `MissingBaseUrlError`. The symptom is the message's job.
  - **A longer name earns its length only if it changes who gets paged.** `SafetyRefusalError`
    over `ConfigError` changes the responder, so it stays.
  - **`Error` suffix always; no *project* prefix.** Prefixing with this project's own name
    (`<Project>ConfigError`) is noise — one error module in one package — and the suffix keeps
    `catch` blocks legible. **An integration prefix is not a project prefix, and is wanted:**
    `Jira` in `JiraReadError` names *which external system failed*, which is the first thing a
    reader needs and the thing that decides who they go to. A second integration brings its own
    prefix rather than sharing these classes.

  This doc governs how the name is **formed**; what each name **means** — the remedy it maps to,
  the codes it narrows, where it's thrown — is owned by [`ERRORS.md`](ERRORS.md).
- **Generated artifacts** (logs, dumps, captures) — any embedded date is **year-first
  sortable `YYYYMMDD`** (never day-first). Use a date *prefix* when a listing should sort
  chronologically (`20260605-143044-label.txt`), a date *suffix* when grouping by name
  matters more (`report-20260605.json`).
