---
"loom": minor
---

**pico8:** ship the 8 per-step effects (none, slide, vibrato, drop, fade-in, fade-out, arp-fast, arp-slow) at slots 0-7. New exports from `@loom/pico8`:

- `EFFECTS: readonly Effect[]` — canonical table, ordered by slot id.
- `EffectName` — kebab-case string-literal union of the 8 names, consumable by the chainable `.fx()` setter in #8.
- `effectIdFromName(name)` / `effectNameFromId(id)` — bidirectional name ↔ id lookups.

Audio semantics are implemented by adapters (e.g. the Web Audio synth in #15). This module only names the slots.
