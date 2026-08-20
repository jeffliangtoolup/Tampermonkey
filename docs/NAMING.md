# Naming conventions

Conventions for new code. TS/JS-flavored — for other languages, keep the *rules* (booleans,
verb prefixes, sortable dates) and swap the case style for the language's idiom. As real code
appears, replace the generic examples with real ones from this repo so each rule stays
grounded. <!-- TODO(template): swap in real examples -->

- **camelCase** — variables, functions, and `let`/`const` declarations.
  *e.g.* `parseConfig()`, `retryCount`, `isReady`.
- **PascalCase** — classes, interfaces, and types.
  *e.g.* `class OrderService`, `interface RetryPolicy`, `type ParseResult`.
- **UPPER_SNAKE_CASE** — constants and enum values.
  *e.g.* `MAX_RETRIES`, `DEFAULT_TIMEOUT_MS`, `API_BASE_URL`.
- **Boolean names** — prefix with `is`, `has`, `should`, or `can`.
- **Function names** — use a verb prefix where applicable: `get`, `set`, `fetch`, `handle`,
  `on`, `go`, `expect`, `build`, `parse`. Pick a small verb vocabulary early and stay
  consistent (e.g. all navigation helpers `go*`, all assertion helpers `expect*`).
- **File names — kebab-case where applicable.**
  - **kebab-case** for modules and scripts: `order-service.ts`, `parse-config.ts`.
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
