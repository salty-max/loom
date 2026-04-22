import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { print } from '@loom/adapters/print.js';
import { parseEventsArgs } from '@loom/cli/args.js';
import { Pattern } from '@loom/core/pattern.js';

/** Sinks the `loom events` command writes to. Injectable for tests. */
export interface EventsSinks {
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
}

const DEFAULT_SINKS: EventsSinks = {
  stdout: (line) => {
    process.stdout.write(`${line}\n`);
  },
  stderr: (line) => {
    process.stderr.write(`${line}\n`);
  },
};

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs the `loom events <file> [--cycles N] [--bpm B]` command.
 *
 * Loads the source file via dynamic `import`, takes the module's
 * `default` export as a Pattern, and feeds it through the `print`
 * adapter. Returns the process exit code — 0 on success, 1 on any
 * parse / load / render error.
 *
 * @param argv - Argv tail (the `<file>` + flags, not including `events`)
 * @param sinks - Optional stdout/stderr writers; defaults to process streams
 * @returns Exit code (0 = success, non-zero = error)
 */
export async function runEvents(
  argv: readonly string[],
  sinks: EventsSinks = DEFAULT_SINKS,
): Promise<number> {
  const parsed = parseEventsArgs(argv);
  if ('error' in parsed) {
    sinks.stderr(`loom events: ${parsed.error}`);
    return 1;
  }

  const resolved = path.resolve(parsed.file);
  let module: { default?: unknown };
  try {
    module = (await import(pathToFileURL(resolved).href)) as { default?: unknown };
  } catch (error) {
    sinks.stderr(`loom events: failed to load ${parsed.file}: ${formatError(error)}`);
    return 1;
  }

  const pattern = module.default;
  if (!(pattern instanceof Pattern)) {
    sinks.stderr(
      `loom events: ${parsed.file} must default-export a Pattern (got ${typeof pattern})`,
    );
    return 1;
  }

  try {
    print(pattern, {
      cycles: parsed.cycles,
      ...(parsed.bpm === undefined ? {} : { bpm: parsed.bpm }),
      sink: sinks.stdout,
    });
  } catch (error) {
    sinks.stderr(`loom events: ${formatError(error)}`);
    return 1;
  }

  return 0;
}
