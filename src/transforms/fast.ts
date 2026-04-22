import { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';

/**
 * Compresses a pattern into `1/n` of its original duration. `fast(2, p)`
 * plays `p` at double speed — one cycle's worth of events fires in
 * half a cycle and the pattern repeats within the same interval.
 *
 * @param n - Positive finite scale factor (any rational; integers are typical)
 * @param pattern - The pattern to compress
 * @returns A new Pattern playing `pattern` at `n×` speed
 */
export function fast<T>(n: number, pattern: Pattern<T>): Pattern<T> {
  if (!Number.isFinite(n) || n <= 0) {
    throw new RangeError(`fast: n must be a positive finite number, got ${n}`);
  }
  const factor = Time.from(n);
  return new Pattern<T>((begin, end) => {
    const events = pattern.query(begin.mul(factor), end.mul(factor));
    return events.map((event) => ({
      ...event,
      begin: event.begin.div(factor),
      end: event.end.div(factor),
    }));
  });
}
