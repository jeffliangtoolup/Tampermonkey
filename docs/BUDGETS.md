# Budgets & deadlines

Every call that can hang gets a bound. This doc owns the bounds — one row per hop, what
expires, and what the user sees when it does. [`ARCHITECTURE.md`](ARCHITECTURE.md)'s doc index
points here; the system model summarizes and links rather than restating this table.

The aim: no request waits forever, and no bound is a mystery number.

## The budgets

<!-- TODO(template): one row per bounded hop. A hop with no row has no bound — which is a
     finding worth stating, not an omission to leave quiet. -->

Neither userscript makes a network call of its own, so there is no request timeout in this repo.
What there is instead is a set of **timing constants against a UI that renders when it feels like
it** — every one a bet on how long ShipHawk's own rendering takes. They are budgets in the sense
this doc means: each bounds a wait, and each has a visible consequence when the bet is wrong.

| Hop | Budget | On expiry |
|---|---|---|
| Wait for the ready-to-ship table to render before rewriting it (`Show Images`) | 1000 ms, fixed | **Nothing retries.** The DOM work runs once, on a table that may not be there yet; the injection silently no-ops or throws inside the XHR listener. This is the loosest bet in either file and the one most likely to be wrong on a slow connection. |
| Wait for the tag area or `body` to exist at startup (`paccurate images`, `waitFor`) | 15 s total, polled every 100 ms | Rejects, and `boot()` swallows it with `.catch(() => null)` — then proceeds to run the same DOM reads anyway. Expiry is therefore *not* a stop; it only means the first read happens blind. |
| Sample the popup's size and position while it is open | every 500 ms | Not an expiry — a sampling floor. A move-and-close inside one interval is lost, which is what the Alt+S force-save exists to cover. |
| Snapshot popup geometry just after opening | 500 ms, once | If the browser has not settled the window yet, the saved rect keeps its previous value. Harmless: the watcher above corrects it on the next tick. |
| Re-apply the saved rect after opening or navigating (`nudgeToSavedRect`) | 200 ms delay | The `moveTo`/`resizeTo` pair lands too early and the browser ignores it; the popup opens at the browser's chosen geometry instead of the remembered one. |
| Debounce tag re-reads after a DOM mutation | 60 ms | Deliberately short — a missed coalesce just means an extra `refreshFromDom`, which is idempotent. |
| Re-read tags after a detected route change | 150 ms delay | The new route's tags have not rendered yet, so the read comes back empty and the popup keeps pointing at the previous UUID until the observer fires. |
| Poll for a route change the history hooks missed | every 800 ms | The backstop *is* the expiry path for the `pushState`/`replaceState`/`popstate` trio. Worst case a route change is noticed up to 800 ms late. |

**None of these is injectable or configurable** — every value is a literal at its call site. Both
files are grandfathered (`../CLAUDE.md` § Grandfathered files), so that stays as-is; the Rules
below bind new code, and centralizing these constants is a change for whenever either script next
moves substantially.

## Rules

- **Every budget has a stated reason.** "A person is watching a spinner" and "this runs
  concurrently inside an already-slow request" produce different numbers; a number without its
  reason is un-tunable.
- **The client's bound is looser than every server bound it waits on.** Otherwise the side that
  isn't doing the work kills a request that was working, and the user is told it failed when it
  succeeded.
- **Say whether expiry drops a part or fails the whole.** Losing one enrichment arm and falling
  back is a different event from failing the request. Both are legitimate; the difference
  belongs in the table.
- **A budget bounds the whole call, including the client library's own retries.** A per-attempt
  timeout multiplied by a hidden retry loop is not a bound.
- **Budgets live in one config module**, injectable per call site so tests can pass a small
  value. A test must never wait out a production budget.
- **A client timeout does not stop the server.** When an aborted request may already have
  committed a write, say so — *"this may still have gone through"* — and **offer no retry
  button**, which only invites a duplicate. Tell the user how to check instead.

## Decision rule

If nobody can say what happens when a hop takes ten minutes, that hop has no budget yet.
