---
"loom": minor
---

**pico8:** ship the 8 built-in waveform instruments (triangle, tilted-saw, saw, square, pulse, organ, noise, phaser) at slots 0-7. New exports from `@loom/pico8`:

- `BUILTIN_INSTRUMENTS: readonly BuiltinInstrument[]` — the canonical table, ordered by slot id.
- `InstrumentName` — kebab-case string-literal union of the 8 names, consumable by the chainable setters in #8.
- `instrumentIdFromName(name)` / `instrumentNameFromId(id)` — bidirectional name ↔ id lookups.
- `isBuiltin(id)` — classifies a slot as built-in (0-7) vs custom (8-15).
