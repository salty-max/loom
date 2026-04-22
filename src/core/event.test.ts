import type { Event, EventContext } from '@loom/core/event.js';
import { Time } from '@loom/core/time.js';
import { describe, expect, it } from 'vitest';

describe('Event<T>', () => {
  it('holds begin, end, and value', () => {
    const event: Event<string> = {
      begin: Time.ZERO,
      end: Time.ONE,
      value: 'c3',
    };

    expect(event.begin.eq(Time.ZERO)).toBe(true);
    expect(event.end.eq(Time.ONE)).toBe(true);
    expect(event.value).toBe('c3');
    expect(event.context).toBeUndefined();
  });

  it('carries an optional context', () => {
    const context: EventContext = { origin: 'mini', span: [0, 4] };
    const event: Event<number> = {
      begin: new Time(1n, 4n),
      end: new Time(1n, 2n),
      value: 42,
      context,
    };

    expect(event.begin.eq(new Time(1n, 4n))).toBe(true);
    expect(event.end.eq(new Time(1n, 2n))).toBe(true);
    expect(event.value).toBe(42);
    expect(event.context).toEqual(context);
  });

  it('supports arbitrary value types', () => {
    const note: Event<{ pitch: number; volume: number }> = {
      begin: Time.ZERO,
      end: new Time(1n, 4n),
      value: { pitch: 48, volume: 5 },
    };

    expect(note.begin.eq(Time.ZERO)).toBe(true);
    expect(note.end.eq(new Time(1n, 4n))).toBe(true);
    expect(note.value.pitch).toBe(48);
    expect(note.value.volume).toBe(5);
  });
});
