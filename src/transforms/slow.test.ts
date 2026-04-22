import { Pattern } from '@loom/core/pattern.js';
import { pure, seq, silence } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { slow } from '@loom/transforms/slow.js';
import { describe, expect, it } from 'vitest';

describe('slow', () => {
  it('stretches a pure pattern — one event spans two cycles', () => {
    const events = slow(2, pure('x')).query(Time.ZERO, new Time(2n, 1n));
    expect(events).toHaveLength(1);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(2n, 1n))).toBe(true);
    expect(events[0]?.value).toBe('x');
  });

  it('seq(a, b) stretched by 2 — each half occupies a full cycle', () => {
    const events = slow(2, seq(pure('a'), pure('b'))).query(Time.ZERO, new Time(2n, 1n));
    expect(events.map((e) => e.value)).toEqual(['a', 'b']);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(Time.ONE)).toBe(true);
    expect(events[1]?.begin.eq(Time.ONE)).toBe(true);
    expect(events[1]?.end.eq(new Time(2n, 1n))).toBe(true);
  });

  it('non-integer n stays exact via rational math', () => {
    // slow(1.5) = fast(2/3). Over [0, 1) of a pure pattern, the
    // stretched version covers 2/3 of one cycle — one partial event
    // from [0, 3/2).
    const events = slow(1.5, pure('x')).query(Time.ZERO, Time.ONE);
    expect(events).toHaveLength(1);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(3n, 2n))).toBe(true);
  });

  it('returns a new Pattern — source untouched', () => {
    const source = pure('x');
    const stretched = slow(2, source);
    expect(stretched).not.toBe(source);
    expect(source.query(Time.ZERO, Time.ONE)).toHaveLength(1);
    expect(stretched.query(Time.ZERO, Time.ONE)).toHaveLength(1);
    expect(stretched.query(Time.ZERO, Time.ONE)[0]?.end.eq(new Time(2n, 1n))).toBe(true);
  });

  it('rejects non-positive or non-finite n', () => {
    for (const n of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => slow(n, pure('x'))).toThrow(RangeError);
    }
  });

  it('slow(1, p) is equivalent to p', () => {
    const events = slow(1, seq(pure('a'), pure('b'))).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b']);
    expect(events[0]?.end.eq(new Time(1n, 2n))).toBe(true);
  });

  it('returns silence when given silence', () => {
    expect(slow(3, silence).query(Time.ZERO, Time.ONE)).toEqual([]);
  });

  it('preserves event context through stretching', () => {
    const source = new Pattern<string>(() => [
      { begin: Time.ZERO, end: Time.ONE, value: 'x', context: { origin: 'test' } },
    ]);
    const events = slow(2, source).query(Time.ZERO, new Time(2n, 1n));
    expect(events[0]?.context).toEqual({ origin: 'test' });
  });
});
