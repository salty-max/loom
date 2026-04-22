import { cat, pure, seq, silence, stack } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { describe, expect, it } from 'vitest';

describe('pure', () => {
  it('emits one event per cycle spanning [k, k+1)', () => {
    const events = pure('x').query(Time.ZERO, Time.ONE);
    expect(events).toHaveLength(1);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(Time.ONE)).toBe(true);
    expect(events[0]?.value).toBe('x');
  });

  it('repeats across multiple cycles', () => {
    const events = pure(42).query(Time.ZERO, new Time(3n, 1n));
    expect(events.map((e) => e.value)).toEqual([42, 42, 42]);
    expect(events[0]?.begin.eq(new Time(0n, 1n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(1n, 1n))).toBe(true);
    expect(events[2]?.begin.eq(new Time(2n, 1n))).toBe(true);
  });

  it('emits nothing when end <= begin', () => {
    expect(pure('x').query(Time.ONE, Time.ZERO)).toEqual([]);
  });

  it('handles a query that starts mid-cycle', () => {
    // Query [0.5, 1.5) still catches the cycle-0 event (begins at 0)
    // and the cycle-1 event (begins at 1).
    const events = pure('x').query(new Time(1n, 2n), new Time(3n, 2n));
    expect(events).toHaveLength(2);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[1]?.begin.eq(Time.ONE)).toBe(true);
  });

  it('handles negative-time queries', () => {
    const events = pure('x').query(new Time(-1n, 1n), Time.ONE);
    expect(events).toHaveLength(2);
    expect(events[0]?.begin.eq(new Time(-1n, 1n))).toBe(true);
    expect(events[0]?.end.eq(Time.ZERO)).toBe(true);
    expect(events[1]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[1]?.end.eq(Time.ONE)).toBe(true);
  });
});

describe('silence', () => {
  it('emits no events', () => {
    expect(silence.query(Time.ZERO, new Time(10n, 1n))).toEqual([]);
  });
});

describe('seq', () => {
  it('splits a cycle into equal slots', () => {
    const events = seq(pure('a'), pure('b')).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b']);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(1n, 2n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(1n, 2n))).toBe(true);
    expect(events[1]?.end.eq(Time.ONE)).toBe(true);
  });

  it('supports three equal slots', () => {
    const events = seq(pure('a'), pure('b'), pure('c')).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'c']);
    expect(events[0]?.end.eq(new Time(1n, 3n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(1n, 3n))).toBe(true);
    expect(events[1]?.end.eq(new Time(2n, 3n))).toBe(true);
    expect(events[2]?.begin.eq(new Time(2n, 3n))).toBe(true);
  });

  it('returns silence when called with no arguments', () => {
    const events = seq<string>().query(Time.ZERO, Time.ONE);
    expect(events).toEqual([]);
  });

  it('repeats across cycles', () => {
    const events = seq(pure('a'), pure('b')).query(Time.ZERO, new Time(2n, 1n));
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'a', 'b']);
  });

  it('skips slots outside the query window', () => {
    // Query only the second half — should only contain 'b'.
    const events = seq(pure('a'), pure('b')).query(new Time(1n, 2n), Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['b']);
  });

  it('nests — seq(seq(a,b), c) subdivides the first half', () => {
    const nested = seq(seq(pure('a'), pure('b')), pure('c'));
    const events = nested.query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'c']);
    expect(events[0]?.end.eq(new Time(1n, 4n))).toBe(true);
    expect(events[1]?.end.eq(new Time(1n, 2n))).toBe(true);
    expect(events[2]?.end.eq(Time.ONE)).toBe(true);
  });
});

describe('stack', () => {
  it('layers patterns in parallel in argument order', () => {
    // Pattern.query uses a stable toSorted — events sharing begin=0 keep
    // the order the flatMap produced (argument order).
    const events = stack(pure('a'), pure('b')).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b']);
    for (const e of events) {
      expect(e.begin.eq(Time.ZERO)).toBe(true);
      expect(e.end.eq(Time.ONE)).toBe(true);
    }
  });

  it('returns an empty pattern when called with no arguments', () => {
    expect(stack<string>().query(Time.ZERO, Time.ONE)).toEqual([]);
  });

  it('composes with seq to produce interleaved rhythms', () => {
    const kick = seq(pure('K'), silence);
    const snare = seq(silence, pure('S'));
    const events = stack(kick, snare).query(Time.ZERO, Time.ONE);
    // K fires at [0, 1/2), S fires at [1/2, 1), sorted by begin.
    expect(events.map((e) => e.value)).toEqual(['K', 'S']);
  });
});

describe('cat', () => {
  it('plays one subpattern per cycle, looping', () => {
    const events = cat(pure('a'), pure('b'), pure('c')).query(Time.ZERO, new Time(4n, 1n));
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'c', 'a']);
  });

  it('returns silence when called with no arguments', () => {
    expect(cat<string>().query(Time.ZERO, new Time(3n, 1n))).toEqual([]);
  });

  it('aligns event intervals to their cycle', () => {
    const events = cat(pure('a'), pure('b')).query(Time.ZERO, new Time(2n, 1n));
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(Time.ONE)).toBe(true);
    expect(events[1]?.begin.eq(Time.ONE)).toBe(true);
    expect(events[1]?.end.eq(new Time(2n, 1n))).toBe(true);
  });

  it('skips cycles that fall outside the query window', () => {
    // Query only cycle 1 — should only contain 'b'.
    const events = cat(pure('a'), pure('b'), pure('c')).query(new Time(1n, 1n), new Time(2n, 1n));
    expect(events.map((e) => e.value)).toEqual(['b']);
  });

  it('wraps negative cycles via the canonical ((n % m) + m) % m form', () => {
    // cycle -1 maps to index ((−1 % 3) + 3) % 3 = 2 → 'c'.
    // cycle -2 maps to 1 → 'b'.
    // cycle -3 maps to 0 → 'a'.
    const events = cat(pure('a'), pure('b'), pure('c')).query(new Time(-3n, 1n), Time.ZERO);
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'c']);
  });

  it('skips events inside a cycle that fall outside the query window', () => {
    // cat(seq(silence, pure('tail'))) places 'tail' at [1/2, 1) in cycle 0.
    // Querying [0, 1/2) leaves the event outside the window entirely.
    const pattern = cat(seq(silence, pure('tail')));
    const events = pattern.query(Time.ZERO, new Time(1n, 2n));
    expect(events).toEqual([]);
  });
});
