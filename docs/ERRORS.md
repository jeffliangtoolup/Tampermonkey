# Error taxonomy

The failure vocabulary for errors **this project throws itself**, and — where failures are also
read from the outside (a status board, a log pipeline, an error tracker) — the rules that
classify them after the fact.

This doc owns the **name → purpose mapping**: which remedy each error class stands for, which
codes it narrows, and where each is thrown. How a class name is *formed* is a naming rule, owned
by [`NAMING.md`](NAMING.md) § Error class names.

The rule in one line: **a class names the REMEDY — who has to act — and a `code` names the
specific situation.** Two situations with the same next action are one class.

## The message contract

Every error opens with a header the **base class** composes, so it can't drift between throw
sites:

```
TOKEN[code] — <detail>
```

- **`token`** — the class's remedy label (`RUN CONFIG`, `SAFETY REFUSAL`, …): the stable,
  greppable wire form. Anything downstream matches on this, so treat it as an interface, not a
  string literal to reword.
- **`code`** — the situation, narrowed per class by a closed set (a string-literal union or
  equivalent), so a typo is a compile error rather than a new category.
- **`detail`** — the header-free text, **kept as its own field**. An error re-quoted inside
  another one contributes its `detail`, not a second header.
- The error's `name` is the subclass, so a stack trace says `RunConfigError: …` rather than
  `Error: …`.

The base class is abstract; every concrete class fixes its token and narrows its code.

## The remedy table

<!-- TODO(template): one row per class. The "Who fixes it" column is the whole point of the
     taxonomy — if two rows answer it identically, they are one class. -->

| Class | Token | Who fixes it | What to do |
|---|---|---|---|
| *(none yet)* | | | |

A class whose only distinction is *"do not retry"* still earns its own row: two situations can
both be "config" while only one of them means **stop**.

## Codes and where they are thrown

<!-- TODO(template): one row per code, naming the module that throws it. This table is how a
     reader goes from a pasted message to the line that produced it. -->

| Class | Code | Thrown by |
|---|---|---|
| *(none yet)* | | |

- **A code is promoted to its own class only when its remedy differs from its siblings'.**
- **A code with no thrower is speculative** — add one when a throw site needs it, not in advance.
- Codes are stable identifiers: **never reuse** a retired one.

## What the taxonomy does NOT cover

The most useful section in this doc, and the easiest to skip. Name the failures you deliberately
leave untyped, and why — otherwise every reader re-asks whether the omission was an oversight.

<!-- TODO(template): list the deliberate exclusions. The three that recur:
       - Failures thrown by a FRAMEWORK, not by this code (assertion/expect timeouts, ORM
         errors). No class here can classify what this code never threw.
       - Sites where the code genuinely CANNOT know whose fault it is. Typing them would assign
         blame the throw site doesn't have; the category stays honestly unsettled.
       - Local retry signals — a throw caught three lines later has no remedy, so typing it
         would prefix a *warning* with a remedy label. -->

*(nothing yet)*

## Derived classification

When failures are read back from the outside — a status board, a triage report, an alert — the
tag is **derived from the failure itself on every run**, with no hand-maintained override list.
A curated list of "why this is failing" goes stale silently; a derived one cannot carry a claim
nobody re-derived.

### The tags

<!-- TODO(template): one row per tag, ordered needs-a-human first and no-action last, so the
     tally reads as a queue rather than an alphabetical list. -->

| Tag | Means | Who acts |
|---|---|---|
| *(none yet)* | | |

Two tags always earn their place:

- **An explicit "no rule matched" tag** — the triage queue. It must be a *destination*, not a
  silent default: something a human is expected to look at.
- **A "documented, expected" tag** for failures already accounted for (see
  [`TESTS.md`](TESTS.md) § Known reds), so a tracked failure never reads as a new finding.

Keep the tag set typed **exhaustively against the token set** — adding a token without giving it
a tag should fail to compile, not classify as "unmatched".

### The rules, first match wins

<!-- TODO(template): the ordered rules. Order is design, not convenience — write the reason for
     each ordering choice underneath. -->

| # | Test | → tag |
|---|---|---|
| *(none yet)* | | |

Three ordering principles that generalize:

- **Tokens first.** A token is an exact statement about what threw. A tracked failure that fell
  over on an infrastructure fault should report the fault, not its tracked status.
- **Known/expected membership before symptom signatures**, because membership is often the *only*
  discriminator between a tracked failure and a new one with an identical symptom.
- **No rule for ambiguous shapes.** Where the same error shape has been both a real defect and a
  harness bug, write **no** rule — let it fall to the unmatched tag. Guessing produces a
  confident wrong tag, which is worse than an honest queue entry.

Match unanchored if the message may be wrapped by a framework — a serialized error often carries
a class name ahead of its token.

### Absent vs unmatched

Different facts; show both. **Unmatched** means the rules ran and matched nothing. **Absent**
means nothing classified this failure at all — it predates classification, or there was no error
text to read.

### Self-clearing

A derived tag is stored per failing unit and **deleted when that unit passes**. That is what lets
the report carry a cause with no curation file to go stale.

### Redact before truncating

If a classified excerpt lands in a **committed** artifact, strip credentials **before** truncating
— position must not decide whether a token survives. The secret gate
([`SAFETY-MODES.md`](SAFETY-MODES.md) → The secret gate) is the backstop behind that, not a
substitute for it.

## Decision rule

If two errors send the same person to the same fix, they're one class with two codes. If they
send different people, they're two classes.
