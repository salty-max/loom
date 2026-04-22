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

Strudel-style — everything is a `Pattern`, chained through setters and combinators. No builder objects, no config bags.

```ts
import { mini, stack, cat } from 'loom';

// Mini-notation for rhythm; chained setters for PICO-8 attributes
const bass = mini('<c2 g2 e2 c3>/2').inst('triangle').vol(5).ch(0);
const lead = mini('c5 [e5 g5] ~ c6').inst('square').vol(6).fx('vibrato').ch(1);
const hats = mini('~*4 [c4 c4]*2').inst('noise').vol(3).ch(2);

// Compose with stack (simultaneous) and cat (sequential)
const verse = stack(bass, lead, hats);
const chorus = stack(
  bass,
  lead.fast(2),                    // transform chained on the pattern
  hats,
  mini('c3 g3').slow(2).inst('triangle').ch(3),
);

// The default export is what loom serve / play / render consumes
export default cat(verse, verse, chorus, chorus);
```

Setters accept primitives **or** patterns, so you can vary per step:

```ts
mini('c3 e3 g3 c4').vol(mini('5 3 7 2')).fx('vibrato');
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
