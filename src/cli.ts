#!/usr/bin/env node

import { runEvents } from '@loom/cli/events.js';

const USAGE = `loom — a pattern-algebra DSL for algorithmic music

usage:
  loom <command> [args]

commands:
  events <file> [--cycles N] [--bpm B]
                   print JSON events for N cycles of the pattern
                   default-exported by <file>, one JSON per line
  play   <file>    real-time playback via the web-audio adapter (TODO)
  render <file>    render the pattern to a .wav file (TODO)
  repl             live-coding REPL (TODO)
`;

const command = process.argv[2];

if (command === undefined || command === '--help' || command === '-h') {
  process.stdout.write(USAGE);
  process.exit(0);
}

async function main(): Promise<number> {
  switch (command) {
    case 'events': {
      return runEvents(process.argv.slice(3));
    }
    default: {
      process.stderr.write(`loom: unknown command "${command}"\n`);
      process.stderr.write(USAGE);
      return 1;
    }
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `loom: uncaught error: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
