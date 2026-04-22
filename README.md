# Loom

A pattern-algebra DSL for algorithmic music, inspired by [TidalCycles](https://tidalcycles.org/) and [Strudel](https://strudel.cc/) — deliberately scoped in v0 to what the [PICO-8 tracker](https://www.lexaloffle.com/pico-8.php) can express.

Loom is a TypeScript library with a CLI, runnable in Node and in the browser. The core engine is dep-free pattern algebra; output adapters (print, Web Audio, MIDI) are optional modules on top.

## Why scope to PICO-8?

Two reasons:

1. **Constraints crystallize identity.** 4 channels, 32 steps, 8 waveforms, 8 effects — the PICO-8 tracker is limited enough that mastering it feels achievable and the aesthetic is instantly recognizable. Loom inherits this identity.
2. **Strudel is vast.** Replicating TidalCycles / Strudel in full is 3+ years of work. Shipping a usable v0 in months means drawing a boundary. PICO-8 is a natural one.

The core pattern algebra (rational time, lazy patterns, combinators) is general. The v0 *public API* constrains itself to PICO-8 semantics. Unlocking more Strudel-like power later is additive — existing compositions keep working.

## Status

v0 / scaffold. Not published to npm yet. Roadmap is tracked as GitHub issues under the [Loom project board](#).

## Planned usage

```ts
import { sfx, music, play } from 'loom/pico8';

// A 32-step SFX on one channel — 4 sixteenth-notes repeated
const bass = sfx({
  speed: 16,
  notes: [
    { pitch: 24, instrument: 'triangle', volume: 5, effect: 'none' },
    { pitch: 28, instrument: 'triangle', volume: 5, effect: 'none' },
    // ... 30 more
  ],
});

// A music pattern stacks up to 4 SFX across channels
const intro = music({ ch0: bass });

// Play via the Web Audio adapter
play(intro, { bpm: 120 });
```

CLI (once the `cli` module lands):

```
loom events "path/to/tune.loom.ts"   # print JSON events for 1 cycle
loom play "path/to/tune.loom.ts"     # real-time playback via audio adapter
loom render "path/to/tune.loom.ts" -o out.wav
```

## Install (when published)

```sh
bun add loom
# or: npm / pnpm / yarn add loom
```

## Development

Requires [Bun](https://bun.sh) ≥ 1.3.

```sh
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

CI runs typecheck, lint, test, build, and `knip` dead-code detection on every PR.

## Scope boundaries

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural conventions and the explicit in-scope / out-of-scope lists for v0.

## License

TBD.
