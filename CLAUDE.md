# Loom — Claude Guidelines

A pattern-algebra DSL for algorithmic music. Inspired by TidalCycles and Strudel, but deliberately scoped to the **PICO-8 tracker model** in v0 — see "Scope" below.

Practices distilled from `georide-api-v2/CLAUDE.md` and `georide-mobile-app-v2/CLAUDE.md`, adapted to a pure TypeScript library.

## Tech stack

- **TypeScript** strict mode, ESM-first
- **Bun** (runtime + package manager + bundler) ≥ 1.3
- **Vitest** for tests
- **ESLint** (typescript-eslint strict + prettier + unicorn + simple-import-sort)
- **Husky + lint-staged + commitlint** for pre-commit / commit-msg enforcement
- **Knip** for dead-code detection
- **GitHub Actions** CI (lint / typecheck / test / build / knip on every PR)

`tsc` still drives the library build (we need `.d.ts` emission). Bun runs everything else — scripts, tests-driver, CLI dev loop via `bun run src/cli.ts`.

## Scope (v0 — non-negotiable)

Loom v0 exposes **only what PICO-8's SFX/Music tracker allows**, expressed through a pattern algebra. This is a deliberate constraint — the core engine is extensible, the public surface is not.

**In scope**
- Pattern model: lazy `Pattern<T>`, rational Time, exact fractional subdivisions
- 4 channels max per Music pattern
- 32 steps per SFX
- 8 built-in waveforms (triangle, tilted saw, saw, square, pulse, organ, noise, phaser) + custom instrument slots
- 8 per-step effects (none, slide, vibrato, drop, fade in, fade out, arp fast, arp slow)
- Volume 0-7, pitch 0-63
- Speed 1-255 ticks/step
- Song chain with loop markers

**Planned for v0.1 expansion**
- Mini-notation extensions: groups `[x y]` (#26), alternation `<x y>` (#27), shorthand modifiers `*n` `/n` `@n` (#28)
- Web Audio adapter with 8-bit chiptune synth (#15)
- Runtime hot-swap controller (#25)
- CLI `serve` / `play` / `render` (#18, #19, #24)
- `.p8` cart import/export (#11)

**Planned for v1**
- Mini-notation Euclidean rhythms `x(k, n)` (#29)
- MIDI adapter (#16)
- CLI REPL (#20)

**Out of scope — re-evaluate only if user demand emerges**
- Polymetric `{x y}` and true polyrhythms (rare in chiptune)
- Algorithmic transforms (`jux`, `struct`, `chunk`, inline probability `x?p`)
- Samples / sample-based synthesis (clashes with the "8-bit synth" identity)

The `core/` module is general (pattern algebra can express far more), but the `pico8/` public API stays locked to PICO-8 semantics. Unlocking Strudel-like features later is purely additive — it won't break existing compositions.

## Architectural principles

### Per-module ownership

Every module under `src/` owns its types, its errors, its tests. There is no central error catalog, no central types file. Adding a module is one folder; removing it leaves nothing behind.

### One concern per file

Small, focused files. Split early. If a file passes ~200 lines, consider whether it has more than one concern.

### Dependency direction

Strict layering — **never reversed**:

```
core  →  pico8  →  adapters  →  cli / runtime
```

- `core` is dep-free and knows nothing of PICO-8 or I/O.
- `pico8` depends on `core` only. It validates/constrains; it doesn't emit audio.
- `adapters` depend on `core` + `pico8`. They render patterns to output.
- `cli` and `runtime` depend on all of the above. They orchestrate.

### Path aliases, never relative

Use `@loom/*` (maps to `src/*`). Relative imports are forbidden, enforced by ESLint once the rule lands. Inside a module, sibling imports still use the full alias path.

**Import paths carry a `.js` extension** even though the source file is `.ts`. This is the canonical TypeScript NodeNext pattern — TypeScript resolves `@loom/core/time.js` to `src/core/time.ts` for type-checking, and the emitted JS runs correctly because the same `.js` path exists under `dist/` at runtime. Example:

```ts
import { Time } from '@loom/core/time.js';
export * from '@loom/core/index.js';
```

Omitting the `.js` breaks `tsc` under `moduleResolution: "nodenext"`.

### `index.ts` rules

- Re-exports only — no logic.
- Public surface only — if a type is module-internal, it doesn't appear in `index.ts`.

## File & naming conventions

- Bare names inside a module folder: `src/core/pattern.ts`, **not** `src/core/pattern.core.ts`.
- Tests are co-located: `pattern.ts` + `pattern.test.ts` in the same folder.
- Error codes (when we add an error hierarchy): `SCREAMING_SNAKE_CASE`.
- One exported concept per file. The file name matches the main export (lowercase).

## TypeScript discipline

- `strict: true` including `strictPropertyInitialization`, `useUnknownInCatchVariables`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- No `any`. No `as any`. No `@ts-ignore` without a linked issue.
- `any` escapes are a lint error, not a warning.
- No floating promises.
- Catches receive `unknown` — narrow explicitly.

## Documentation

### JSDoc on exports

Add JSDoc to exported functions, classes, types. Keep it to a **short description** plus `@param` / `@returns`.

- **No `@example` blocks** — tests serve that purpose.
- **No file-level module JSDoc** — the file name and exports speak for themselves.

```ts
/**
 * Queries a pattern over the half-open interval [begin, end) and returns
 * the events that fall within. Events may extend past `end`.
 *
 * @param begin - Inclusive lower bound (cycles)
 * @param end - Exclusive upper bound (cycles)
 * @returns Events sorted by begin time
 */
query(begin: Time, end: Time): Event<T>[];
```

### Inline comments

Explain **why**, not **what**. The code shows the what; the comment adds context the reader cannot derive.

```ts
// Good
// Normalize sign to numerator so gcd reduction stays well-defined.
const sign = d < 0n ? -1n : 1n;

// Bad — restates the code
const sign = d < 0n ? -1n : 1n; // check if negative
```

Use single-line `//` comments. Comment blocks of logic, not individual trivial lines. No comments on self-evident assignments or obvious conditionals.

### Never silently swallow errors

Every `try/catch` must either handle the error meaningfully or re-throw. No bare `catch {}`. No `catch (err) { console.error(err); }` as the only action — if you can't recover, let it propagate.

Exception: deliberate fallback paths with a comment explaining why silence is acceptable (e.g., parse fallback that returns a default when input is clearly invalid by design).

## Testing

- **Vitest**, co-located `.test.ts`.
- Coverage threshold: 80% statements, 75% branches, 80% functions, 80% lines.
- Unit-test the core primitives individually. Integration tests exercise the full pipeline (compose → query → adapter).
- Reset any singleton state in `beforeEach` when relevant.

## Project structure

```
loom/
├── src/
│   ├── core/            # Pure pattern algebra (dep-free)
│   │   ├── time.ts
│   │   ├── event.ts
│   │   ├── pattern.ts
│   │   └── index.ts
│   ├── pico8/           # PICO-8-flavored layer (depends on core)
│   │   ├── types.ts
│   │   ├── instruments.ts
│   │   ├── effects.ts
│   │   ├── sfx.ts
│   │   ├── music.ts
│   │   └── index.ts
│   ├── mini/            # Mini-notation parser (v0.1+)
│   ├── transforms/      # Pattern transforms (v0.1+ for PICO-8 subset)
│   ├── adapters/        # Output adapters
│   │   └── print.ts     # stdout JSON events
│   ├── runtime/         # REPL, eval sandbox (v0.2+)
│   ├── cli.ts           # CLI entry
│   └── index.ts         # Public API re-exports
├── test/                # Integration tests (unit tests are co-located)
├── .github/workflows/
│   └── ci.yml
├── .husky/
├── CLAUDE.md
├── README.md
├── commitlint.config.js
├── eslint.config.mjs
├── knip.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.ts
```

## Commit convention

Conventional commits enforced by commitlint with a **strict scope-enum**. See `commitlint.config.js` for the allowed list. Scopes match directories under `src/` or cross-cutting keywords.

When you create a new module under `src/`, add its scope to `commitlint.config.js` **in the same commit** that creates the directory. The scope-enum and the repo state stay in sync.

### Examples

```
feat(core): implement Pattern lazy query
feat(pico8): add 8 built-in waveform instruments
fix(mini): handle trailing whitespace in rest token
refactor(adapters/print): flatten event structure
chore(deps): upgrade typescript to 5.8
docs(claude): document the PICO-8 scope boundary
```

### Forbidden

- Scope-less commits
- Scopes that don't match a real directory
- `--no-verify` or any hook skip
- Amending published commits
- Co-author trailers mentioning Claude or AI tools

When addressing review feedback, **always `fixup!`** into the original commit, never create standalone "fix review" commits.

## Branching

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
refactor/<short-description>
test/<short-description>
```

## Issue-to-PR workflow

When working through the backlog:

1. **One PR per issue.** Never bundle multiple issues into a single branch or PR.
2. **Wait for merge before starting the next issue.** After opening a PR, stop and wait for the user to merge (or to explicitly say "continue" / "stack"). Do not branch the next issue off an unmerged one unless told to.
3. **Self-review loop before handing off.** Once the implementation for an issue feels done:
   - Run `/review` (or spawn the review agent) against the current branch.
   - Apply every bug, nit, and suggestion the reviewer flags — use `git commit --fixup <sha>` on the original commit, never a standalone "address review" commit.
   - Re-run the reviewer.
   - Repeat until the reviewer responds **LGTM** (or equivalent "no further changes").
   - Only then open / push the PR to the user.
4. **Reviewer feedback is binding.** Do not cherry-pick which suggestions to apply. If a suggestion is wrong, push back in the review thread rather than silently ignoring it.
5. **Every feature/fix PR carries a changeset.** Before opening the PR, run `bun run changeset`, pick the bump level (`patch` / `minor` / `major`), and write the user-facing summary. The resulting `.changeset/*.md` file is committed alongside the code on the same branch. Pure tooling / chore / docs / ci / test PRs that don't change public behavior can skip the changeset — the Changeset Bot's warning on those is expected.

   **Pre-MVP posture:** no automatic release workflow runs on `main` yet. Changesets accumulate in `.changeset/` across the v0 backlog. When the MVP ships, run `bun run changeset:version` locally once — it consumes every pending changeset into a single version bump and a complete `CHANGELOG.md` for v0.1.0. Post-MVP, if the team wants an auto-release workflow, wire `changesets/action@v1` into `.github/workflows/release.yml`.

## Key rules summary

1. **Scope locked to PICO-8 in v0** — public API does not expose anything PICO-8 can't do.
2. **Per-module ownership** — each folder under `src/` owns its types, errors, tests.
3. **Layering** — `core → pico8 → adapters → cli/runtime`, never reversed.
4. **Path aliases only** — `@loom/*`, no relative imports.
5. **`index.ts` re-exports only** — no logic.
6. **One concern per file**, tests co-located.
7. **Strict TypeScript** — no `any`, no `@ts-ignore`, catches are `unknown`.
8. **JSDoc on exports** — short, `@param`/`@returns`, no `@example`, no file-level.
9. **Comments explain WHY**, never WHAT.
10. **Never silently swallow errors**.
11. **Conventional commits with strict scope-enum** — every commit must have a valid scope.
12. **Fixup for review feedback** — never standalone "fix review" commits.
13. **Never mention Claude in commits, PRs, or issues.**
14. **Never skip hooks** (`--no-verify`, `--no-gpg-sign`, etc.).
15. **One PR per issue, wait for merge, self-review until LGTM** — see "Issue-to-PR workflow" above.
16. **Feature/fix PRs include a changeset** — see "Issue-to-PR workflow" rule 5.
