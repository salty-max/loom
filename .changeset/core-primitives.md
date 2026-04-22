---
"loom": minor
---

**core:** ship the five foundational pattern constructors.

- `pure(value)` — emits one event per cycle spanning `[k, k+1)`, value-typed.
- `silence` — the empty pattern (`Pattern<never>`), composes anywhere.
- `seq(...patterns)` — divides every cycle into equal slots, one subpattern per slot.
- `stack(...patterns)` — layers subpatterns in parallel on the same interval; argument order is preserved via `Pattern.query`'s stable sort.
- `cat(...patterns)` — rotates one subpattern per cycle, handling negative-cycle wrap via `((n % m) + m) % m`.

All exported from `@loom/core`.
