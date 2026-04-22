import { Pattern } from '@loom/core/pattern.js';
import { pure, seq, silence } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { fast } from '@loom/transforms/fast.js';
import { describe, expect, it } from 'vitest';

describe('fast', () => {
  it('compresses one cycle of pure into two events in the same window', () => {
    const events = fast(2, pure('x')).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['x', 'x']);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(1n, 2n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(1n, 2n))).toBe(true);
    expect(events[1]?.end.eq(Time.ONE)).toBe(true);
  });

  it('composes with seq — fast(2, seq(a, b)) fires four events per cycle', () => {
    const events = fast(2, seq(pure('a'), pure('b'))).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'a', 'b']);
    expect(events[0]?.end.eq(new Time(1n, 4n))).toBe(true);
    expect(events[1]?.end.eq(new Time(1n, 2n))).toBe(true);
    expect(events[2]?.end.eq(new Time(3n, 4n))).toBe(true);
    expect(events[3]?.end.eq(Time.ONE)).toBe(true);
  });

  it('accepts non-integer n with exact rational math', () => {
    // fast(3/2, pure('x')) plays pure at 1.5x speed: in one cycle
    // you hear 3 halves of a pure-cycle, i.e. one full + a half.
    // Over [0, 1) we see one event at [0, 2/3) plus the start of
    // the next at [2/3, 4/3).
    const events = fast(1.5, pure('x')).query(Time.ZERO, Time.ONE);
    expect(events).toHaveLength(2);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(2n, 3n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(2n, 3n))).toBe(true);
    expect(events[1]?.end.eq(new Time(4n, 3n))).toBe(true);
  });

  it('returns a new Pattern — the source is untouched', () => {
    const source = pure('x');
    const sped = fast(2, source);
    expect(sped).not.toBe(source);
    expect(source.query(Time.ZERO, Time.ONE)).toHaveLength(1);
    expect(sped.query(Time.ZERO, Time.ONE)).toHaveLength(2);
  });

  it('rejects non-positive or non-finite n', () => {
    for (const n of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => fast(n, pure('x'))).toThrow(RangeError);
    }
  });

  it('fast(1, p) is equivalent to p', () => {
    const events = fast(1, seq(pure('a'), pure('b'))).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b']);
    expect(events[0]?.end.eq(new Time(1n, 2n))).toBe(true);
  });

  it('returns silence when given silence', () => {
    expect(fast(3, silence).query(Time.ZERO, Time.ONE)).toEqual([]);
  });

  it('preserves event context through compression', () => {
    const source = new Pattern<string>(() => [
      { begin: Time.ZERO, end: Time.ONE, value: 'x', context: { origin: 'test' } },
    ]);
    const events = fast(2, source).query(Time.ZERO, Time.ONE);
    expect(events[0]?.context).toEqual({ origin: 'test' });
  });
});
