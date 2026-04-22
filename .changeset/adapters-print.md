---
"loom": minor
---

**adapters:** ship `print(pattern, options)` — the simplest adapter, writing one JSON event per line to stdout.

- `cycles` (required positive integer): how many cycles of the pattern to query.
- `bpm` (optional positive finite number, defaults to `DEFAULT_BPM = 120`): used to derive wall-clock `beginMs` / `endMs` at `time.toNumber() * 60_000 / bpm`. **Always emitted** — the output shape is stable regardless of whether the caller supplies a bpm.
- `sink` (optional `(line: string) => void`): defaults to `console.log`. CLI wrappers and tests can pass a spy / writable stream.

Each line serializes `{ begin, end, value, beginMs, endMs }` where `begin`/`end` use `Time.toString()` (bare integer or `"num/den"`). `value` passes through verbatim. `Event.context` is intentionally dropped — it's a debug-only origin hint, not a consumer-visible field. The event stream is the canonical target for `loom events` (#17) and for tests exploring what a given pattern emits.
