import type { Event } from '@loom/core/event.js';
import { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';

/**
 * A pattern emitting a single event per cycle carrying `value`. Every
 * integer cycle `k` produces an event on `[k, k+1)`.
 *
 * @param value - The value emitted every cycle
 * @returns A Pattern of `value`
 */
export function pure<T>(value: T): Pattern<T> {
  return new Pattern<T>((begin, end) => {
    const events: Event<T>[] = [];
    let cycle = begin.floor();
    while (cycle.lt(end)) {
      events.push({ begin: cycle, end: cycle.add(Time.ONE), value });
      cycle = cycle.add(Time.ONE);
    }
    return events;
  });
}

/**
 * The empty pattern — produces no events on any interval. Assignable
 * anywhere a `Pattern<T>` is expected since `never` is a subtype of
 * every type.
 */
export const silence: Pattern<never> = new Pattern<never>(() => []);

/**
 * Concatenates patterns within each cycle, giving every slot an equal
 * slice of time. `seq(a, b, c)` plays `a`, then `b`, then `c` over one
 * cycle and repeats. Empty input returns `silence`.
 *
 * @param patterns - Subpatterns to place end-to-end
 * @returns A Pattern firing the subpatterns in sequence each cycle
 */
export function seq<T>(...patterns: Pattern<T>[]): Pattern<T> {
  if (patterns.length === 0) {
    return silence;
  }
  const n = BigInt(patterns.length);
  const slotLength = new Time(1n, n);

  return new Pattern<T>((begin, end) => {
    const events: Event<T>[] = [];
    let cycle = begin.floor();
    while (cycle.lt(end)) {
      for (const [i, pattern] of patterns.entries()) {
        const slotBegin = cycle.add(new Time(BigInt(i), n));
        const slotEnd = slotBegin.add(slotLength);
        if (slotEnd.lte(begin) || slotBegin.gte(end)) {
          continue;
        }
        for (const event of pattern.query(Time.ZERO, Time.ONE)) {
          events.push({
            ...event,
            begin: slotBegin.add(event.begin.mul(slotLength)),
            end: slotBegin.add(event.end.mul(slotLength)),
          });
        }
      }
      cycle = cycle.add(Time.ONE);
    }
    return events;
  });
}

/**
 * Layers patterns in parallel on the same time interval. `stack(a, b)`
 * plays `a` and `b` simultaneously, merging their events.
 *
 * @param patterns - Subpatterns to overlay
 * @returns A Pattern carrying every subpattern's events
 */
export function stack<T>(...patterns: Pattern<T>[]): Pattern<T> {
  return new Pattern<T>((begin, end) => patterns.flatMap((p) => p.query(begin, end)));
}

/**
 * Concatenates patterns across cycles — one full cycle per subpattern,
 * looping. `cat(a, b, c)` plays `a` on cycle 0, `b` on cycle 1, `c` on
 * cycle 2, then `a` again on cycle 3, and so on. Empty input returns
 * `silence`.
 *
 * @param patterns - Subpatterns to cycle through
 * @returns A Pattern firing one subpattern per cycle in round-robin
 */
export function cat<T>(...patterns: Pattern<T>[]): Pattern<T> {
  if (patterns.length === 0) {
    return silence;
  }
  const n = BigInt(patterns.length);

  return new Pattern<T>((begin, end) => {
    const events: Event<T>[] = [];
    let cycle = begin.floor();
    while (cycle.lt(end)) {
      // cycle.num is the integer cycle index (cycle is always integer here
      // because floor() normalizes den to 1). Modulo n cycles the index,
      // and the extra `+ n) % n` normalizes negative cycles.
      const index = Number(((cycle.num % n) + n) % n);
      // index is provably in [0, patterns.length) by construction of
      // the modulo, so the lookup is safe — noUncheckedIndexedAccess
      // forces us to assert it manually.
      const pattern = patterns[index] as Pattern<T>;
      for (const event of pattern.query(Time.ZERO, Time.ONE)) {
        const shiftedBegin = cycle.add(event.begin);
        const shiftedEnd = cycle.add(event.end);
        if (shiftedEnd.lte(begin) || shiftedBegin.gte(end)) {
          continue;
        }
        events.push({ ...event, begin: shiftedBegin, end: shiftedEnd });
      }
      cycle = cycle.add(Time.ONE);
    }
    return events;
  });
}
