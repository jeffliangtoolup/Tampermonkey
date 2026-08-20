# Subagent model selection

Rules for choosing a model when spinning up subagents (the `Agent` tool's `model` arg). One
rubric, four factors — match the model to the subtask, and state the tier explicitly on every
spawn.

## The four factors

Weigh these together; capability required is the ceiling, cost is the pressure to stay under it.

- **Subtask difficulty / needs** — how much reasoning, judgment, or disambiguation the subtask
  actually demands. Rote and bounded vs. open-ended and ambiguous.
- **Model capability** — the smallest tier that can do the subtask correctly. Don't buy more
  capability than the work needs.
- **Estimated token need** — how much context the subagent must read and how much it must
  produce. High-volume, repetitive work multiplies the per-token cost decision.
- **Estimated token cost per agent** — capability × token need, per agent, times the number of
  agents in a fan-out. A cheap tier across many parallel agents beats an expensive default.

## The tier mapping

- **Haiku** (`model: 'haiku'`) — **simple, high-volume, mechanical, or narrow-context subtasks.**
  *e.g.* single-file lookups, rote find/replace, small mechanical conformance dirs, bounded
  extraction, "does file X contain Y" checks.
- **Sonnet** (`model: 'sonnet'`) — **middle-difficulty subtasks needing real reasoning but not
  frontier depth. The default for non-trivial work.** *e.g.* most convention-conformance sweeps,
  multi-file exploration, ambiguity that still resolves against a clear rubric.
- **Opus** (`model: 'opus'`) — **reserved for the most complex subtasks only.** *e.g.* deep
  architectural reasoning, high-ambiguity judgment calls, or work where a wrong call is expensive.
  Not the default just because the parent runs on a frontier model.

## Always state the tier

A subagent **inherits the parent's model when `model` is omitted.** When the parent runs a
frontier-tier model, omitting `model` silently picks the most expensive tier — so **set `model`
explicitly on every spawned agent**, even when the choice is Sonnet. The rubric only saves cost
if it's applied at the call site.

## Related

- The `/refactor` skill (`.claude/skills/refactor/SKILL.md`, Step 2) is the concrete consumer:
  its conformance subagents default to Sonnet, drop to Haiku for trivially small dirs, and never
  use Opus.
