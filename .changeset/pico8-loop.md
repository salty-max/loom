---
"loom": minor
---

**pico8:** ship `Pattern.loop({ start, end })` and `getLoopRange()`.

- `.loop({ start, end })` on any Pattern attaches song-loop metadata: cycle indices (zero-based, both inclusive) that the scheduler and `.p8` serializer read to decide where a song's repeating section lies. Returns a new Pattern — the source is untouched.
- `getLoopRange(pattern)` reads the metadata back. Returns `undefined` if no `.loop()` was attached (the scheduler treats that as "play once and stop").
- Basic shape validation runs at `.loop()` time — integer, non-negative, `start <= end`. Invalid shapes throw `Pico8Error('PICO8_SONG_LOOP_OUT_OF_RANGE')` with a `{ range }` details payload. Bounds against the actual cycle count are re-validated by downstream consumers that know the total span (adapters, `.p8` serializer).
- Metadata lives in a `WeakMap` side channel so `core` stays dep-free of PICO-8 concerns; the range is garbage-collected alongside the Pattern it belongs to.
