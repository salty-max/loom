// Side-effect import: attaches the chainable setters onto Pattern.prototype.
import '@loom/pico8/augment.js';

import { Pattern } from '@loom/core/pattern.js';
import { pure, seq } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { EFFECTS } from '@loom/pico8/effects.js';
import { Pico8Error } from '@loom/pico8/errors.js';
import { BUILTIN_INSTRUMENTS } from '@loom/pico8/instruments.js';
import { describe, expect, it } from 'vitest';

describe('pico8/augment — chainable setters', () => {
  describe('inst / instrument', () => {
    it('accepts a numeric slot and attaches inst to every event', () => {
      const events = pure({ pitch: 48 }).inst(3).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, inst: 3 });
    });

    it('resolves a built-in name to its slot', () => {
      const events = pure({ pitch: 48 }).inst('triangle').query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, inst: 0 });
    });

    it('throws PICO8_UNKNOWN_INSTRUMENT on an invalid name', () => {
      try {
        pure({ pitch: 48 }).inst('wobble' as 'triangle');
        expect.fail('expected throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Pico8Error);
        expect((error as Pico8Error).code).toBe('PICO8_UNKNOWN_INSTRUMENT');
      }
    });

    it('zips a Pattern value per step', () => {
      // seq(pure(0), pure(5)) fires 0 on [0, 1/2) and 5 on [1/2, 1).
      // Run two pure notes over those halves via seq of pure notes.
      const notes = pure({ pitch: 48 });
      const ids = pure(7 as const); // constant id everywhere
      const events = notes.inst(ids).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, inst: 7 });
    });

    it('long alias .instrument is the same method', () => {
      const events = pure({ pitch: 48 }).instrument('square').query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, inst: 3 });
    });

    it('resolves every built-in instrument name through the setter', () => {
      // Guards against drift between the BUILTIN_INSTRUMENTS table
      // and the InstrumentName union consumed by .inst().
      for (const { id, name } of BUILTIN_INSTRUMENTS) {
        const events = pure({ pitch: 48 }).inst(name).query(Time.ZERO, Time.ONE);
        expect(events[0]?.value).toEqual({ pitch: 48, inst: id });
      }
    });
  });

  describe('vol / volume', () => {
    it('accepts a constant', () => {
      const events = pure({ pitch: 48 }).vol(5).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, vol: 5 });
    });

    it('accepts a Pattern value', () => {
      const events = pure({ pitch: 48 }).vol(pure(3)).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, vol: 3 });
    });

    it('long alias .volume', () => {
      const events = pure({ pitch: 48 }).volume(7).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, vol: 7 });
    });
  });

  describe('fx / effect', () => {
    it('accepts a numeric effect id', () => {
      const events = pure({ pitch: 48 }).fx(2).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, fx: 2 });
    });

    it('resolves a kebab-case effect name', () => {
      const events = pure({ pitch: 48 }).fx('fade-in').query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, fx: 4 });
    });

    it('throws PICO8_UNKNOWN_EFFECT on an invalid name', () => {
      try {
        pure({ pitch: 48 }).fx('wobble' as 'slide');
        expect.fail('expected throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Pico8Error);
        expect((error as Pico8Error).code).toBe('PICO8_UNKNOWN_EFFECT');
      }
    });

    it('accepts a Pattern value', () => {
      const events = pure({ pitch: 48 }).fx(pure(6)).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, fx: 6 });
    });

    it('long alias .effect', () => {
      const events = pure({ pitch: 48 }).effect('vibrato').query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, fx: 2 });
    });

    it('resolves every effect name through the setter', () => {
      // Guards against drift between the EFFECTS table and the
      // EffectName union consumed by .fx().
      for (const { id, name } of EFFECTS) {
        const events = pure({ pitch: 48 }).fx(name).query(Time.ZERO, Time.ONE);
        expect(events[0]?.value).toEqual({ pitch: 48, fx: id });
      }
    });
  });

  describe('ch / channel', () => {
    it('attaches the channel to every event', () => {
      const events = pure({ pitch: 48 }).ch(2).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, ch: 2 });
    });

    it('long alias .channel', () => {
      const events = pure({ pitch: 48 }).channel(0).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, ch: 0 });
    });
  });

  describe('speed', () => {
    it('attaches the speed to every event', () => {
      const events = pure({ pitch: 48 }).speed(16).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, speed: 16 });
    });
  });

  describe('chaining', () => {
    it('composes all setters into a single event value', () => {
      const events = pure({ pitch: 48 })
        .inst('triangle')
        .vol(5)
        .fx('slide')
        .ch(0)
        .speed(16)
        .query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({
        pitch: 48,
        inst: 0,
        vol: 5,
        fx: 1,
        ch: 0,
        speed: 16,
      });
    });

    it('later setters overwrite earlier ones on the same key', () => {
      const events = pure({ pitch: 48 }).vol(2).vol(7).query(Time.ZERO, Time.ONE);
      expect(events[0]?.value).toEqual({ pitch: 48, vol: 7 });
    });

    it('each setter returns a new Pattern — the source is unchanged', () => {
      const base = pure({ pitch: 48 });
      const attached = base.vol(5);
      expect(base.query(Time.ZERO, Time.ONE)[0]?.value).toEqual({ pitch: 48 });
      expect(attached.query(Time.ZERO, Time.ONE)[0]?.value).toEqual({ pitch: 48, vol: 5 });
    });
  });

  describe('pattern-value zipping', () => {
    it('drops base events that have no value active at their begin', () => {
      const notes = pure({ pitch: 48 });
      const empty = new Pattern<number>(() => []);
      const events = notes.vol(empty).query(Time.ZERO, Time.ONE);
      expect(events).toEqual([]);
    });

    it('returns nothing when the base pattern is empty (constant value path)', () => {
      const empty = new Pattern<{ pitch: number }>(() => []);
      const events = empty.vol(5).query(Time.ZERO, Time.ONE);
      expect(events).toEqual([]);
    });

    it('returns nothing when the base pattern is empty (pattern-value path)', () => {
      const empty = new Pattern<{ pitch: number }>(() => []);
      const values = pure(5);
      const events = empty.vol(values).query(Time.ZERO, Time.ONE);
      expect(events).toEqual([]);
    });

    it('zips per-step varying values into per-step varying notes', () => {
      // Four notes across a cycle with four varying volumes at the
      // same grid — the Strudel-style `.vol(mini('5 3 7 2'))` case.
      const notes = seq(
        pure({ pitch: 48 }),
        pure({ pitch: 52 }),
        pure({ pitch: 55 }),
        pure({ pitch: 60 }),
      );
      const vols = seq(pure(5), pure(3), pure(7), pure(2));
      const events = notes.vol(vols).query(Time.ZERO, Time.ONE);
      expect(events.map((e) => e.value)).toEqual([
        { pitch: 48, vol: 5 },
        { pitch: 52, vol: 3 },
        { pitch: 55, vol: 7 },
        { pitch: 60, vol: 2 },
      ]);
    });

    it('extends the value-query window to cover base events that overflow end', () => {
      // A base event that spans [0, 2) — ends past the query window [0, 1).
      const tail = new Pattern<{ pitch: number }>(() => [
        { begin: Time.ZERO, end: new Time(2n, 1n), value: { pitch: 48 } },
      ]);
      // Value pattern is defined only over [1, 2), so the base event's
      // begin (=0) must be looked up there — it won't match and the
      // event is dropped. This exercises the maxEnd extension path.
      const values = new Pattern<number>(() => [
        { begin: Time.ONE, end: new Time(2n, 1n), value: 7 },
      ]);
      const events = tail.vol(values).query(Time.ZERO, Time.ONE);
      expect(events).toEqual([]);
    });
  });
});
