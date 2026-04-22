import { Pattern } from '@loom/core/pattern.js';
import { Pico8Error } from '@loom/pico8/errors.js';
import type { LoopRange } from '@loom/pico8/types.js';

declare module '@loom/core/pattern.js' {
  interface Pattern<T> {
    /**
     * Attaches a song-loop range to the pattern. The scheduler (and
     * `.p8` serializer) reads the range to decide where to loop: once
     * playback reaches the cycle at `end`, the next cycle resumes at
     * `start` and repeats until stopped.
     *
     * Indices count cycle positions inside the outer pattern,
     * zero-based, both inclusive. Without `.loop()`, a pattern plays
     * once and the scheduler emits silence after.
     *
     * Basic shape validation runs here: integer, non-negative,
     * `start <= end`. Bounds against the actual cycle count are
     * re-validated by consumers (adapters, `.p8` serializer) that
     * know the total cycle span.
     *
     * Invalid shapes throw `Pico8Error('PICO8_SONG_LOOP_OUT_OF_RANGE')`.
     *
     * @param range - `{ start, end }` cycle indices, both inclusive
     * @returns A new Pattern carrying the loop metadata
     */
    loop(range: LoopRange): Pattern<T>;
  }
}

// Side-channel storage — keeps the loop metadata out of the core
// Pattern class so `core` stays dep-free of PICO-8 concerns. The
// WeakMap is keyed on Pattern instances so loop metadata is gc'd
// alongside the pattern it belongs to.
const LOOP_RANGES = new WeakMap<Pattern<unknown>, LoopRange>();

/**
 * Returns the loop range attached to `pattern` via `.loop()`, or
 * `undefined` if none. Consumed by the runtime scheduler (#25) and
 * the `.p8` serializer (#11).
 *
 * @param pattern - Any Pattern
 * @returns The loop range, or `undefined` if no `.loop()` was attached
 */
export function getLoopRange(pattern: Pattern<unknown>): LoopRange | undefined {
  return LOOP_RANGES.get(pattern);
}

function validateLoopRange(range: LoopRange): void {
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 0 ||
    range.end < range.start
  ) {
    throw new Pico8Error(
      'PICO8_SONG_LOOP_OUT_OF_RANGE',
      `Invalid loop range {start: ${range.start}, end: ${range.end}}: require non-negative integers with start <= end`,
      { range },
    );
  }
}

Pattern.prototype.loop = function loop<T>(this: Pattern<T>, range: LoopRange): Pattern<T> {
  validateLoopRange(range);
  // Wrap the query rather than mutate this Pattern — immutability
  // mirrors the event-value setters, and cloning ensures repeated
  // `.loop()` calls replace the metadata on distinct instances.
  const copy = new Pattern<T>((begin, end) => this.query(begin, end));
  LOOP_RANGES.set(copy, { start: range.start, end: range.end });
  return copy;
};
