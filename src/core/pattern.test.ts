import type { Event } from '@loom/core/event.js';
import { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';
import { describe, expect, it, vi } from 'vitest';

function mkEvent<T>(begin: Time, end: Time, value: T): Event<T> {
  return { begin, end, value };
}

describe('Pattern<T>', () => {
  it('is lazy — the query function is not invoked until query() is called', () => {
    const queryFunction = vi.fn(() => []);
    new Pattern(queryFunction);
    expect(queryFunction).not.toHaveBeenCalled();
  });

  it('returns events from the underlying query function', () => {
    const event = mkEvent(Time.ZERO, Time.ONE, 'hello');
    const pattern = new Pattern(() => [event]);

    expect(pattern.query(Time.ZERO, Time.ONE)).toEqual([event]);
  });

  it('returns events sorted by begin time', () => {
    const unordered = [
      mkEvent(new Time(2n, 4n), new Time(3n, 4n), 'c'),
      mkEvent(Time.ZERO, new Time(1n, 4n), 'a'),
      mkEvent(new Time(1n, 4n), new Time(2n, 4n), 'b'),
    ];
    const pattern = new Pattern(() => unordered);

    const events = pattern.query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value)).toEqual(['a', 'b', 'c']);
  });

  it('sorts stably — events sharing a begin time keep input order', () => {
    const events = [
      mkEvent(Time.ZERO, new Time(1n, 2n), 'first'),
      mkEvent(Time.ZERO, Time.ONE, 'second'),
      mkEvent(Time.ZERO, new Time(3n, 4n), 'third'),
    ];
    const pattern = new Pattern(() => events);

    expect(pattern.query(Time.ZERO, Time.ONE).map((e) => e.value)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('returns events that begin exactly at the inclusive lower bound', () => {
    const event = mkEvent(new Time(1n, 4n), new Time(1n, 2n), 'edge');
    const pattern = new Pattern(() => [event]);

    expect(pattern.query(new Time(1n, 4n), Time.ONE)).toEqual([event]);
  });

  it('preserves events whose end extends past the query upper bound', () => {
    const tail = mkEvent(new Time(3n, 4n), new Time(5n, 4n), 'tail');
    const pattern = new Pattern(() => [tail]);

    const events = pattern.query(Time.ZERO, Time.ONE);
    expect(events).toEqual([tail]);
    expect(events[0]?.end.gt(Time.ONE)).toBe(true);
  });

  it('returns an empty array when end <= begin without invoking the query function', () => {
    const queryFunction = vi.fn(() => [mkEvent(Time.ZERO, Time.ONE, 'x')]);
    const pattern = new Pattern(queryFunction);

    expect(pattern.query(Time.ONE, Time.ZERO)).toEqual([]);
    expect(pattern.query(Time.ONE, Time.ONE)).toEqual([]);
    expect(queryFunction).not.toHaveBeenCalled();
  });

  it('does not mutate the events returned by the query function', () => {
    const original = [
      mkEvent(new Time(1n, 2n), Time.ONE, 'b'),
      mkEvent(Time.ZERO, new Time(1n, 2n), 'a'),
    ];
    const snapshot = [...original];
    const pattern = new Pattern(() => original);

    pattern.query(Time.ZERO, Time.ONE);

    expect(original).toEqual(snapshot);
  });

  it('is pure — repeated queries over the same interval return matching events', () => {
    const pattern = new Pattern<number>(() => [mkEvent(Time.ZERO, Time.ONE, 42)]);

    const first = pattern.query(Time.ZERO, Time.ONE);
    const second = pattern.query(Time.ZERO, Time.ONE);

    expect(first).toEqual(second);
  });

  describe('map', () => {
    it('applies fn to each event value and preserves time intervals', () => {
      const pattern = new Pattern<number>(() => [
        mkEvent(Time.ZERO, new Time(1n, 2n), 1),
        mkEvent(new Time(1n, 2n), Time.ONE, 2),
      ]);
      const doubled = pattern.map((n) => n * 2);
      const events = doubled.query(Time.ZERO, Time.ONE);

      expect(events.map((e) => e.value)).toEqual([2, 4]);
      expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
      expect(events[1]?.begin.eq(new Time(1n, 2n))).toBe(true);
    });

    it('preserves context', () => {
      const pattern = new Pattern<number>(() => [
        { begin: Time.ZERO, end: Time.ONE, value: 1, context: { origin: 'test' } },
      ]);
      const mapped = pattern.map((n) => n + 1);
      const events = mapped.query(Time.ZERO, Time.ONE);

      expect(events[0]?.context).toEqual({ origin: 'test' });
    });

    it('omits context when the source event has none', () => {
      const pattern = new Pattern<number>(() => [mkEvent(Time.ZERO, Time.ONE, 1)]);
      const mapped = pattern.map((n) => n);
      const events = mapped.query(Time.ZERO, Time.ONE);

      expect(events[0]).not.toHaveProperty('context');
    });

    it('returns a new pattern — the original is untouched', () => {
      const pattern = new Pattern<number>(() => [mkEvent(Time.ZERO, Time.ONE, 1)]);
      const mapped = pattern.map((n) => n * 10);

      expect(mapped).not.toBe(pattern);
      expect(pattern.query(Time.ZERO, Time.ONE)[0]?.value).toBe(1);
      expect(mapped.query(Time.ZERO, Time.ONE)[0]?.value).toBe(10);
    });
  });
});
