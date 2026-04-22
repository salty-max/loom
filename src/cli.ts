#!/usr/bin/env node

// Loom CLI. Scaffolded — commands (events, play, render, repl) are tracked
// as GitHub issues under the `cli` scope.

const USAGE = `loom — a pattern-algebra DSL for algorithmic music

usage:
  loom <command> [args]

commands:
  events <file>    print JSON events for one cycle of the given pattern
  play   <file>    real-time playback via the web-audio adapter (TODO)
  render <file>    render the pattern to a .wav file (TODO)
  repl             live-coding REPL (TODO)

This is the v0 scaffold — commands are not implemented yet.
See CLAUDE.md for the PICO-8 scope boundary and the roadmap issues for
the planned implementation order.
`;

const [, , command] = process.argv;

if (!command || command === '--help' || command === '-h') {
  process.stdout.write(USAGE);
  process.exit(0);
}

process.stderr.write(`loom: unknown command "${command}"\n`);
process.stderr.write(USAGE);
process.exit(1);
