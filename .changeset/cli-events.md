---
"loom": minor
---

**cli:** ship `loom events <file> [--cycles N] [--bpm B]` — the first concrete CLI command.

- Loads `<file>` via dynamic `import`, takes the module's `default` export as a Pattern, and pipes it through the print adapter.
- `--cycles N` defaults to 1; `--bpm B` defaults to `DEFAULT_BPM` (120).
- Structured exit codes: 0 on success, 1 on any parse / load / render error, each with a concise `loom events:` stderr message.
- Non-Pattern default exports fail with a clear `must default-export a Pattern` message.

Also restructures the CLI into `src/cli.ts` (thin entry) + `src/cli/args.ts` + `src/cli/events.ts` so commands can live side-by-side as the v0.1 `play` / `render` commands come online.

**Deferred to [#54](https://github.com/salty-max/loom/issues/54):** the AC's "sandboxed import surface (only `loom/*` paths resolvable)" constraint. The current CLI uses a plain dynamic import — user files can pull in anything Node/Bun resolves. A follow-up issue tracks adding a pre-flight import-allowlist check.

Closes #17.
