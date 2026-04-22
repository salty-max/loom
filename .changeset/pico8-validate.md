---
"loom": minor
---

**pico8:** ship `pico8Validate(pattern, cycles)` — a pre-flight check that throws `Pico8Error('PICO8_TOO_MANY_CHANNELS')` if any instant has more than `MUSIC_CHANNELS_MAX` (= 4) distinct channels active. Events with no `.ch` default to channel 0; concurrent same-channel events are allowed (PICO-8's last-hit-wins semantics).

The error carries a structured `details: { at: string; channels: ChannelIndex[] }` payload naming the offending cycle instant and the colliding channel ids. Use for CLI warnings (`loom events`) and as the template the Web Audio adapter (#15) enforces at query time.

Also extends `Pico8Error` with an optional `details` field for machine-readable error payloads.
