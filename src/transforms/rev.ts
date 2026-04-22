import type { Event } from '@loom/core/event.js';
import { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';

/**
 * Reverses the event order within each cycle. An event at `[a, b)`
 * inside cycle `k` becomes an event at `[2k + 1 − b, 2k + 1 − a)` —
 * reflecting around the cycle's midpoint.
 *
 * Cycle boundaries are preserved: events don't leak from one cycle
 * to its neighbours after reversal. Events that cross cycle
 * boundaries in the source are reflected within the cycle they
 * start in.
 *
 * @param pattern - The pattern to reverse
 * @returns A new Pattern with each cycle's events mirrored in time
 */
export function rev<T>(pattern: Pattern<T>): Pattern<T> {
  return new Pattern<T>((begin, end) => {
    const events: Event<T>[] = [];
    let cycle = begin.floor();
    while (cycle.lt(end)) {
      const cycleEnd = cycle.add(Time.ONE);
      const cycleEvents = pattern.query(cycle, cycleEnd);
      for (const event of cycleEvents) {
        // Reflect [event.begin, event.end) around cycle + 1/2.
        // reflectedBegin = cycle + (cycleEnd - event.end)
        // reflectedEnd   = cycle + (cycleEnd - event.begin)
        const reflectedBegin = cycle.add(cycleEnd.sub(event.end));
        const reflectedEnd = cycle.add(cycleEnd.sub(event.begin));
        // A per-cycle reflection can land outside a mid-cycle query
        // window — e.g. reflecting `a@[0, 1/4)` to `[3/4, 1)` when
        // the window is `[1/4, 3/4)`. Filter those out the same way
        // `seq`/`cat` do, so downstream consumers never see events
        // fully outside the scheduled span.
        if (reflectedEnd.lte(begin) || reflectedBegin.gte(end)) {
          continue;
        }
        events.push({
          ...event,
          begin: reflectedBegin,
          end: reflectedEnd,
        });
      }
      cycle = cycle.add(Time.ONE);
    }
    return events;
  });
}
