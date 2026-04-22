/** Parsed argument shape for the `loom events` command. */
export interface EventsArgs {
  readonly file: string;
  readonly cycles: number;
  readonly bpm?: number;
}

/**
 * Parses argv tail (everything after `loom events`) into a
 * validated {@link EventsArgs} shape.
 *
 * Accepts: `<file> [--cycles N] [--bpm B]`. Unknown flags, missing
 * file, or malformed numeric values produce a human-readable error
 * string the caller can route to stderr.
 *
 * @param argv - Remaining argv after the subcommand token
 * @returns Parsed args, or `{ error }` on a malformed invocation
 */
export function parseEventsArgs(argv: readonly string[]): EventsArgs | { readonly error: string } {
  let file: string | undefined;
  let cycles = 1;
  let bpm: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cycles') {
      const value = argv[i + 1];
      if (value === undefined) {
        return { error: `--cycles requires a value` };
      }
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return { error: `--cycles must be a positive integer, got ${value}` };
      }
      cycles = parsed;
      i += 1;
      continue;
    }
    if (arg === '--bpm') {
      const value = argv[i + 1];
      if (value === undefined) {
        return { error: `--bpm requires a value` };
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { error: `--bpm must be a positive finite number, got ${value}` };
      }
      bpm = parsed;
      i += 1;
      continue;
    }
    if (arg !== undefined && arg.startsWith('--')) {
      return { error: `unknown flag ${arg}` };
    }
    if (file === undefined && arg !== undefined) {
      file = arg;
      continue;
    }
    return { error: `unexpected positional argument ${JSON.stringify(arg)}` };
  }

  if (file === undefined) {
    return { error: `missing <file> argument` };
  }

  return bpm === undefined ? { file, cycles } : { file, cycles, bpm };
}
