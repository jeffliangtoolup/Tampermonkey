# Budgets & deadlines

Every call that can hang gets a bound. This doc owns the bounds — one row per hop, what
expires, and what the user sees when it does. [`ARCHITECTURE.md`](ARCHITECTURE.md)'s doc index
points here; the system model summarizes and links rather than restating this table.

The aim: no request waits forever, and no bound is a mystery number.

## The budgets

<!-- TODO(template): one row per bounded hop. A hop with no row has no bound — which is a
     finding worth stating, not an omission to leave quiet. -->

| Hop | Budget | On expiry |
|---|---|---|
| *(not yet written)* | | |

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
