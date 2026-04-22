import type { Event } from '@loom/core/event.js';
import { Time } from '@loom/core/time.js';

/**
 * Signature of the lazy query a pattern wraps. Given a half-open time
 * interval it returns the events active within. Custom implementations
 * may return events whose `end` extends past the query's `end` — the
 * wrapping `Pattern` preserves them so consumers can render tails
 * across cycle boundaries.
 */
export type QueryFunction<T> = (begin: Time, end: Time) => Event<T>[];

/**
 * The core abstraction. A `Pattern<T>` is a lazy query over rational
 * time — the event list is produced on demand when `query` is called.
 * Patterns are pure: given the same interval, they always return the
 * same events.
 */
export class Pattern<T> {
  private readonly queryFunction: QueryFunction<T>;

  constructor(queryFunction: QueryFunction<T>) {
    this.queryFunction = queryFunction;
  }

  /**
   * Queries the pattern over `[begin, end)` and returns the events that
   * fall within that interval, sorted by begin time. Events may extend
   * past `end`.
   *
   * @param begin - Inclusive lower bound (cycles)
   * @param end - Exclusive upper bound (cycles)
   * @returns Events sorted by begin time
   */
  query(begin: Time, end: Time): Event<T>[] {
    if (end.lte(begin)) {
      return [];
    }
    const events = this.queryFunction(begin, end);
    return events.toSorted((a, b) => {
      if (a.begin.lt(b.begin)) {
        return -1;
      }
      if (a.begin.gt(b.begin)) {
        return 1;
      }
      return 0;
    });
  }

  /**
   * Maps each event's value through `fn`, preserving time intervals
   * and context. Returns a new Pattern — the original is untouched.
   *
   * @param fn - Function applied to each event value
   * @returns A new Pattern carrying the mapped values
   */
  map<U>(fn: (value: T) => U): Pattern<U> {
    return new Pattern<U>((begin, end) =>
      this.query(begin, end).map((event) => ({
        begin: event.begin,
        end: event.end,
        value: fn(event.value),
        ...(event.context === undefined ? {} : { context: event.context }),
      })),
    );
  }
}
