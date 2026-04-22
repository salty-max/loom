// Side effect: attaches .fast / .slow / .rev on Pattern.prototype.
import '@loom/transforms/augment.js';

import { pure, seq } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { describe, expect, it } from 'vitest';

describe('transforms/augment — Pattern method form', () => {
  it('.fast(n) matches fast(n, this)', () => {
    const events = pure('x').fast(2).query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['x', 'x']);
  });

  it('.slow(n) matches slow(n, this)', () => {
    const events = pure('x').slow(2).query(Time.ZERO, new Time(2n, 1n));
    expect(events).toHaveLength(1);
    expect(events[0]?.end.eq(new Time(2n, 1n))).toBe(true);
  });

  it('.rev() matches rev(this)', () => {
    const events = seq(pure('a'), pure('b')).rev().query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['b', 'a']);
  });

  it('chains cleanly — seq(a, b, c).fast(2).rev()', () => {
    const events = seq(pure('a'), pure('b'), pure('c')).fast(2).rev().query(Time.ZERO, Time.ONE);
    // fast(2, seq(a,b,c)) plays a,b,c,a,b,c in one cycle.
    // rev flips each cycle: c,b,a,c,b,a.
    expect(events.map((e) => e.value)).toEqual(['c', 'b', 'a', 'c', 'b', 'a']);
  });
});
