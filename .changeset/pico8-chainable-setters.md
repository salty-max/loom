---
"loom": minor
---

**pico8:** ship the Strudel-style chainable attribute setters for every `Pattern<T>`. Importing `@loom/pico8` augments `Pattern.prototype` with:

- `.inst(x)` / `.instrument(x)` — waveform slot (0-15, built-in name, or `Pattern<InstrumentId>`)
- `.vol(n)` / `.volume(n)` — volume (0-7 or `Pattern<Volume>`)
- `.fx(x)` / `.effect(x)` — effect (0-7, kebab-case name, or `Pattern<EffectId>`)
- `.ch(n)` / `.channel(n)` — music channel (0-3, enforced at the type level)
- `.speed(n)` — ticks per step (1-255)

Each setter returns a new `Pattern` with the attribute merged into every event's value. Primitive values apply uniformly; `Pattern` values "zip" — the value pattern's events structure which base events survive.

Invalid string names throw `Pico8Error` with codes `PICO8_UNKNOWN_INSTRUMENT` / `PICO8_UNKNOWN_EFFECT`. Also newly exported:

- `Pico8Error` / `Pico8ErrorCode` — stable error-code hierarchy for the PICO-8 layer
- `ChannelIndex` / `Pico8Attributes` — the attribute-bearing shape consumed by adapters

Range validation for `Volume`, `Pitch`, `Speed` is deferred to adapters — this module only sets attributes.
