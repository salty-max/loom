---
"loom": minor
---

**mini:** ship `mini(source)` — the whitespace-separated mini-notation parser.

- Tokens: note names (`c3`, `d#4`, `f#-1`, …) and the rest marker `~`. Note names decode to MIDI pitch (C4 = 60); `#` is a sharp, flats are deferred.
- N tokens divide each cycle into N equal slots — same semantics as `seq(...)`. Empty / whitespace-only sources return `silence`.
- Unknown tokens throw `MiniError('MINI_UNKNOWN_TOKEN')` with a `{ token }` details payload.
- `parseNoteName(token)` is also exported as a standalone note-name → MIDI decoder for anyone parsing outside the mini grammar.

New public API from `@loom/mini`:
- `mini(source)` — returns `Pattern<MiniNote>` where `MiniNote = { pitch: number }`.
- `parseNoteName(token)` — `string → number | undefined`.
- `MiniError` / `MiniErrorCode` — stable error-code hierarchy for the mini layer.

Out of v0 (per issue #12): `[x y]` groups (#26), `<x y>` alternation (#27), `*n`/`/n`/`@n` modifiers (#28), euclidean `x(k, n)` (#29).

Closes #12.
