import { Pattern } from '@loom/core/pattern.js';
import { pure, seq, silence } from '@loom/core/primitives.js';
import { MiniError } from '@loom/mini/errors.js';
import { parseNoteName } from '@loom/mini/note-name.js';

/** The event-value shape emitted by `mini()` — just a MIDI pitch. */
export interface MiniNote {
  readonly pitch: number;
}

/**
 * Parses a whitespace-separated mini-notation string into a Pattern.
 *
 * Tokens supported in v0:
 * - **Note names** — `c3`, `d#4`, `f#-1`, etc. Decode to MIDI pitch
 *   (`c4 = 60`). `#` is a sharp; flats are not yet supported
 *   (write `d#3` for `Eb3`).
 * - **Rest** — `~` produces no event for that slot.
 *
 * The N parsed tokens divide each cycle into N equal slots — same
 * semantics as `seq(...)`. An empty / whitespace-only source returns
 * `silence`.
 *
 * @param source - Whitespace-separated sequence of note/rest tokens
 * @returns A Pattern emitting one `MiniNote` per note token, per cycle
 * @throws `MiniError('MINI_UNKNOWN_TOKEN')` on any token that is
 *   neither `~` nor a valid note name
 */
export function mini(source: string): Pattern<MiniNote> {
  const tokens = source
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return silence;
  }

  const slots: Pattern<MiniNote>[] = tokens.map((token) => {
    if (token === '~') {
      return silence;
    }
    const pitch = parseNoteName(token);
    if (pitch === undefined) {
      throw new MiniError(
        'MINI_UNKNOWN_TOKEN',
        `Unknown mini-notation token: ${JSON.stringify(token)}`,
        {
          token,
        },
      );
    }
    return pure({ pitch });
  });

  return slots.length === 1 ? (slots[0] as Pattern<MiniNote>) : seq(...slots);
}
