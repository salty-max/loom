/**
 * Allowed commit scopes for Loom.
 *
 * Structured scopes follow the src/ layout:
 *   core, pico8, mini, transforms, adapters, runtime, cli
 * Plus cross-cutting keywords.
 *
 * When you create a new module under src/, add its scope to `sources`
 * in the same commit that creates the directory.
 */

const sources = [
  // Pure pattern algebra: Time rationals, Event, Pattern<T> with lazy query,
  // primitives (pure, silence, seq, stack, cat). Dependency-free.
  'core',

  // PICO-8-flavored layer on top of core: 4-channel SFX (32 steps), 8 built-in
  // waveforms + custom slots, 8 per-step effects, speed, note range 0-63,
  // Music patterns, Song chains with loop markers. The public surface of v0.
  'pico8',

  // Mini-notation parser. v0 supports space-separated values and rests (~).
  // Groups [x y] / alternation <x y> come later if needed.
  'mini',

  // Pattern transformations (fast, slow, rev, every, ...). Kept minimal in v0
  // to match the PICO-8 scope; expanded later as Strudel-like features unlock.
  'transforms',

  // Output adapters: print (stdout events), web-audio (browser 8-bit synth),
  // midi (Web MIDI / node-midi), osc (SuperCollider).
  'adapters',

  // REPL, eval sandbox, live-coding entry point.
  'runtime',

  // CLI binary: commands (events, play, render), argv parsing, REPL mode.
  'cli',
];

const keywords = [
  // Root configs: package.json scripts, exports, bin mapping.
  'build',
  // GitHub Actions workflows.
  'ci',
  // Dependency changes.
  'deps',
  // README, CLAUDE.md, architectural notes.
  'docs',
  // ESLint configuration.
  'eslint',
  // Git configuration (.gitignore, .gitattributes).
  'git',
  // Husky hooks.
  'husky',
  // Knip configuration.
  'knip',
  // lint-staged, prettier config, format scripts.
  'lint',
  // pnpm configuration.
  'pnpm',
  // Vitest configuration, coverage.
  'test',
  // Cross-cutting developer tooling.
  'tooling',
  // TypeScript configuration.
  'tsconfig',
  // CLAUDE.md guidelines.
  'claude',
];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...sources, ...keywords]],
    'scope-empty': [2, 'never'],
  },
};
