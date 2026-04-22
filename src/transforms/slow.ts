import { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';

/**
 * Stretches a pattern to `n×` its original duration. `slow(2, p)`
 * plays `p` at half speed — one cycle's worth of events now occupies
 * two cycles of output.
 *
 * Semantically the inverse of {@link fast} — `slow(n, p)` equals
 * `fast(1/n, p)`. Implemented directly on rational Time to preserve
 * precision for non-integer `n`.
 *
 * @param n - Positive finite stretch factor
 * @param pattern - The pattern to stretch
 * @returns A new Pattern playing `pattern` at `1/n` speed
 */
export function slow<T>(n: number, pattern: Pattern<T>): Pattern<T> {
  if (!Number.isFinite(n) || n <= 0) {
    throw new RangeError(`slow: n must be a positive finite number, got ${n}`);
  }
  const factor = Time.from(n);
  return new Pattern<T>((begin, end) => {
    const events = pattern.query(begin.div(factor), end.div(factor));
    return events.map((event) => ({
      ...event,
      begin: event.begin.mul(factor),
      end: event.end.mul(factor),
    }));
  });
}
