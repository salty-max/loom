// Side effect: attaches .inst/.ch on Pattern.prototype for the
// "loop survives a prior setter" test.
import '@loom/pico8/augment.js';

import { cat, pure } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { Pico8Error } from '@loom/pico8/errors.js';
// Importing getLoopRange also runs loop.ts's top-level side effect
// that attaches Pattern.prototype.loop.
import { getLoopRange } from '@loom/pico8/loop.js';
import type { LoopRange } from '@loom/pico8/types.js';
import { describe, expect, it } from 'vitest';

describe('pico8/loop — Pattern.loop()', () => {
  it('attaches a loop range to a pattern, readable via getLoopRange', () => {
    const song = cat(pure('intro'), pure('verse'), pure('groove'));
    const looped = song.loop({ start: 2, end: 2 });

    expect(getLoopRange(looped)).toEqual({ start: 2, end: 2 });
  });

  it('leaves the source pattern untouched (new Pattern instance)', () => {
    const song = cat(pure('a'), pure('b'));
    const looped = song.loop({ start: 0, end: 1 });

    expect(looped).not.toBe(song);
    expect(getLoopRange(song)).toBeUndefined();
    expect(getLoopRange(looped)).toEqual({ start: 0, end: 1 });
  });

  it('preserves the pattern queries the source would produce', () => {
    const song = cat(pure('a'), pure('b'));
    const looped = song.loop({ start: 0, end: 1 });

    const srcEvents = song.query(Time.ZERO, new Time(2n, 1n)).map((e) => e.value);
    const loopEvents = looped.query(Time.ZERO, new Time(2n, 1n)).map((e) => e.value);
    expect(loopEvents).toEqual(srcEvents);
  });

  it('allows start === end (loop a single position)', () => {
    const song = cat(pure('a'), pure('b'), pure('c'));
    const looped = song.loop({ start: 1, end: 1 });
    expect(getLoopRange(looped)).toEqual({ start: 1, end: 1 });
  });

  it('later .loop() calls replace the range on a fresh instance', () => {
    const song = cat(pure('a'), pure('b'), pure('c'));
    const first = song.loop({ start: 0, end: 1 });
    const second = first.loop({ start: 1, end: 2 });

    expect(getLoopRange(first)).toEqual({ start: 0, end: 1 });
    expect(getLoopRange(second)).toEqual({ start: 1, end: 2 });
    expect(first).not.toBe(second);
  });

  describe('validation', () => {
    it('throws PICO8_SONG_LOOP_OUT_OF_RANGE on negative start', () => {
      const song = cat(pure('a'), pure('b'));
      try {
        song.loop({ start: -1, end: 1 });
        expect.fail('expected throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Pico8Error);
        expect((error as Pico8Error).code).toBe('PICO8_SONG_LOOP_OUT_OF_RANGE');
      }
    });

    it('throws when end < start', () => {
      const song = cat(pure('a'), pure('b'));
      try {
        song.loop({ start: 1, end: 0 });
        expect.fail('expected throw');
      } catch (error) {
        expect((error as Pico8Error).code).toBe('PICO8_SONG_LOOP_OUT_OF_RANGE');
      }
    });

    it('throws on non-integer start or end', () => {
      const song = cat(pure('a'), pure('b'));
      for (const range of [
        { start: 0.5, end: 1 },
        { start: 0, end: 1.5 },
      ] satisfies LoopRange[]) {
        try {
          song.loop(range);
          expect.fail(`expected throw for ${JSON.stringify(range)}`);
        } catch (error) {
          expect((error as Pico8Error).code).toBe('PICO8_SONG_LOOP_OUT_OF_RANGE');
        }
      }
    });

    it('surfaces the offending range in the error details', () => {
      const song = cat(pure('a'));
      try {
        song.loop({ start: 5, end: 2 });
        expect.fail('expected throw');
      } catch (error) {
        const err = error as Pico8Error;
        expect(err.details).toEqual({ range: { start: 5, end: 2 } });
      }
    });
  });
});

describe('pico8/loop — getLoopRange', () => {
  it('returns undefined for a pattern without a loop', () => {
    const song = cat(pure('a'), pure('b'));
    expect(getLoopRange(song)).toBeUndefined();
  });
});

describe('pico8/loop — interaction with other setters', () => {
  it('loop metadata survives when .loop() is chained AFTER another setter', () => {
    // .ch(0).loop(...) applies the channel first, then attaches loop
    // metadata to the resulting Pattern. getLoopRange reads it.
    const song = cat(pure({ pitch: 48 }), pure({ pitch: 52 }))
      .ch(0)
      .loop({ start: 0, end: 1 });
    expect(getLoopRange(song)).toEqual({ start: 0, end: 1 });
  });

  it('loop metadata does NOT survive transforms applied AFTER .loop()', () => {
    // .loop() attaches metadata to its returned Pattern. Any
    // downstream transform (.map, .ch, etc.) produces a fresh
    // Pattern instance that is not a key in the WeakMap, so the
    // range is gone — consistent with the fact that downstream
    // transforms can shift event timings and invalidate cycle
    // indices.
    const looped = cat(pure({ pitch: 48 }), pure({ pitch: 52 })).loop({
      start: 0,
      end: 1,
    });
    expect(getLoopRange(looped)).toEqual({ start: 0, end: 1 });

    const mapped = looped.map((v) => v);
    expect(getLoopRange(mapped)).toBeUndefined();

    const channelled = looped.ch(0);
    expect(getLoopRange(channelled)).toBeUndefined();
  });
});
