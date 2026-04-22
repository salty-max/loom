import { Pattern } from '@loom/core/pattern.js';
import { pure, seq, silence } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { rev } from '@loom/transforms/rev.js';
import { describe, expect, it } from 'vitest';

describe('rev', () => {
  it('flips seq(a, b, c, d) → d, c, b, a within one cycle', () => {
    const events = rev(seq(pure('a'), pure('b'), pure('c'), pure('d'))).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['d', 'c', 'b', 'a']);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(new Time(1n, 4n))).toBe(true);
    expect(events[3]?.begin.eq(new Time(3n, 4n))).toBe(true);
    expect(events[3]?.end.eq(Time.ONE)).toBe(true);
  });

  it('is its own inverse — rev(rev(p)) ≡ p', () => {
    const p = seq(pure('a'), pure('b'), pure('c'));
    const double = rev(rev(p)).query(Time.ZERO, Time.ONE);
    const original = p.query(Time.ZERO, Time.ONE);
    expect(double.map((e) => e.value)).toEqual(original.map((e) => e.value));
    expect(double[0]?.begin.eq(original[0]?.begin ?? Time.ZERO)).toBe(true);
  });

  it('leaves a single-event pure pattern as-is (its cycle is symmetric)', () => {
    const events = rev(pure('x')).query(Time.ZERO, Time.ONE);
    expect(events).toHaveLength(1);
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(Time.ONE)).toBe(true);
  });

  it('reverses each cycle independently over a multi-cycle query', () => {
    const events = rev(seq(pure('a'), pure('b'))).query(Time.ZERO, new Time(2n, 1n));
    // Cycle 0: seq → [a, b], reversed → [b, a].
    // Cycle 1: seq → [a, b], reversed → [b, a].
    expect(events.map((e) => e.value)).toEqual(['b', 'a', 'b', 'a']);
    expect(events[2]?.begin.eq(Time.ONE)).toBe(true);
  });

  it('returns a new Pattern — source untouched', () => {
    const source = seq(pure('a'), pure('b'));
    const reversed = rev(source);
    expect(reversed).not.toBe(source);
    expect(source.query(Time.ZERO, Time.ONE).map((e) => e.value)).toEqual(['a', 'b']);
    expect(reversed.query(Time.ZERO, Time.ONE).map((e) => e.value)).toEqual(['b', 'a']);
  });

  it('emits nothing when the query window is empty', () => {
    expect(rev(pure('x')).query(Time.ONE, Time.ZERO)).toEqual([]);
  });

  it('drops reflected events that land outside a mid-cycle window', () => {
    // seq(a, b, c, d) reversed yields d,c,b,a at [0,1/4),[1/4,1/2),[1/2,3/4),[3/4,1).
    // Querying [1/4, 3/4) should yield only c,b — d and a fall outside.
    const events = rev(seq(pure('a'), pure('b'), pure('c'), pure('d'))).query(
      new Time(1n, 4n),
      new Time(3n, 4n),
    );
    expect(events.map((e) => e.value)).toEqual(['c', 'b']);
  });

  it('returns silence when given silence', () => {
    expect(rev(silence).query(Time.ZERO, Time.ONE)).toEqual([]);
  });

  it('handles negative-time queries', () => {
    // Cycle -1 of seq(a,b) reflects to b,a at [-1, -1/2), [-1/2, 0).
    const events = rev(seq(pure('a'), pure('b'))).query(new Time(-1n, 1n), Time.ZERO);
    expect(events.map((e) => e.value)).toEqual(['b', 'a']);
    expect(events[0]?.begin.eq(new Time(-1n, 1n))).toBe(true);
    expect(events[0]?.end.eq(new Time(-1n, 2n))).toBe(true);
    expect(events[1]?.begin.eq(new Time(-1n, 2n))).toBe(true);
    expect(events[1]?.end.eq(Time.ZERO)).toBe(true);
  });

  it('preserves event context through reflection', () => {
    const source = new Pattern<string>(() => [
      { begin: Time.ZERO, end: Time.ONE, value: 'x', context: { origin: 'test' } },
    ]);
    const events = rev(source).query(Time.ZERO, Time.ONE);
    expect(events[0]?.context).toEqual({ origin: 'test' });
  });
});
