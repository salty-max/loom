// Side-effect imports for the interop tests — mini-produced Patterns
// should chain cleanly through the pico8 setters and time transforms.
import '@loom/pico8/augment.js';
import '@loom/transforms/augment.js';

import { Time } from '@loom/core/time.js';
import { MiniError } from '@loom/mini/errors.js';
import { mini } from '@loom/mini/parse.js';
import { describe, expect, it } from 'vitest';

describe('mini', () => {
  it('parses a single note into one event per cycle', () => {
    const events = mini('c3').query(Time.ZERO, Time.ONE);
    expect(events).toHaveLength(1);
    expect(events[0]?.value).toEqual({ pitch: 48 });
    expect(events[0]?.begin.eq(Time.ZERO)).toBe(true);
    expect(events[0]?.end.eq(Time.ONE)).toBe(true);
  });

  it('splits N tokens into N equal slots within one cycle', () => {
    const events = mini('c3 e3 g3 c4').query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value.pitch)).toEqual([48, 52, 55, 60]);
    expect(events[0]?.end.eq(new Time(1n, 4n))).toBe(true);
    expect(events[1]?.end.eq(new Time(1n, 2n))).toBe(true);
    expect(events[2]?.end.eq(new Time(3n, 4n))).toBe(true);
    expect(events[3]?.end.eq(Time.ONE)).toBe(true);
  });

  it('treats `~` as a rest (no event in that slot)', () => {
    const events = mini('c3 e3 ~ g3').query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value.pitch)).toEqual([48, 52, 55]);
    // Rest slot has no event; g3 fires at [3/4, 1).
    expect(events[2]?.begin.eq(new Time(3n, 4n))).toBe(true);
  });

  it('handles leading/trailing/internal whitespace', () => {
    const events = mini('  c3   e3\tg3  ').query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value.pitch)).toEqual([48, 52, 55]);
  });

  it('returns silence for an empty or whitespace-only source', () => {
    expect(mini('').query(Time.ZERO, Time.ONE)).toEqual([]);
    expect(mini('   ').query(Time.ZERO, Time.ONE)).toEqual([]);
    expect(mini('\t\n').query(Time.ZERO, Time.ONE)).toEqual([]);
  });

  it('supports sharps via #', () => {
    const events = mini('c3 c#3 d3').query(Time.ZERO, Time.ONE);
    expect(events.map((e) => e.value.pitch)).toEqual([48, 49, 50]);
  });

  it('throws MINI_UNKNOWN_TOKEN on invalid tokens', () => {
    try {
      mini('c3 wobble g3');
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(MiniError);
      const err = error as MiniError;
      expect(err.code).toBe('MINI_UNKNOWN_TOKEN');
      expect(err.details).toEqual({ token: 'wobble' });
    }
  });

  it('rejects note letters outside a-g (e.g. h)', () => {
    try {
      mini('h3');
      expect.fail('expected throw');
    } catch (error) {
      expect((error as MiniError).code).toBe('MINI_UNKNOWN_TOKEN');
    }
  });

  it('repeats across cycles', () => {
    const events = mini('c3 e3').query(Time.ZERO, new Time(2n, 1n));
    expect(events.map((e) => e.value.pitch)).toEqual([48, 52, 48, 52]);
  });

  describe('interop with pico8 setters and transforms', () => {
    it('chains through .vol and .ch — the end-to-end story from issue #8', () => {
      const events = mini('c3 e3').vol(5).ch(0).query(Time.ZERO, Time.ONE);
      expect(events.map((e) => e.value)).toEqual([
        { pitch: 48, vol: 5, ch: 0 },
        { pitch: 52, vol: 5, ch: 0 },
      ]);
    });

    it('composes with .fast — mini(...).fast(2) doubles event density', () => {
      const events = mini('c3 e3').fast(2).query(Time.ZERO, Time.ONE);
      expect(events.map((e) => e.value.pitch)).toEqual([48, 52, 48, 52]);
      expect(events[0]?.end.eq(new Time(1n, 4n))).toBe(true);
    });
  });
});
