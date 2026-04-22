import '@loom/pico8/augment.js';

import { cat, pure, silence, stack } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { Pico8Error } from '@loom/pico8/errors.js';
import { type Pico8TooManyChannelsDetails, pico8Validate } from '@loom/pico8/validate.js';
import { describe, expect, it } from 'vitest';

describe('pico8Validate', () => {
  it('passes when every instant has <= 4 distinct channels', () => {
    const pattern = stack(
      pure({ pitch: 48 }).ch(0),
      pure({ pitch: 52 }).ch(1),
      pure({ pitch: 55 }).ch(2),
      pure({ pitch: 60 }).ch(3),
    );
    expect(() => {
      pico8Validate(pattern, 1);
    }).not.toThrow();
  });

  it('treats events with no .ch as channel 0', () => {
    const pattern = stack(pure({ pitch: 48 }), pure({ pitch: 52 }));
    // Both default to ch 0 — one distinct channel, not a collision.
    expect(() => {
      pico8Validate(pattern, 1);
    }).not.toThrow();
  });

  it('allows concurrent same-channel events (PICO-8 last-hit-wins)', () => {
    const pattern = stack(
      pure({ pitch: 48 }).ch(0),
      pure({ pitch: 52 }).ch(0),
      pure({ pitch: 55 }).ch(0),
      pure({ pitch: 60 }).ch(0),
      pure({ pitch: 63 }).ch(0),
    );
    // Five events, same channel — one distinct channel, still under 4.
    expect(() => {
      pico8Validate(pattern, 1);
    }).not.toThrow();
  });

  it('throws when >4 distinct channels collide at an instant', () => {
    // ChannelIndex is typed `0|1|2|3`, so `.ch(4)` is a compile
    // error. To exercise the runtime path we inject a 5th channel
    // via an ad-hoc event value — simulating a malformed source
    // (e.g. a buggy `.p8` parser) that hands off out-of-range ids.
    const pattern = stack(
      pure({ pitch: 48 }).ch(0),
      pure({ pitch: 52 }).ch(1),
      pure({ pitch: 55 }).ch(2),
      pure({ pitch: 60 }).ch(3),
      pure({ pitch: 63, ch: 4 as unknown as 0 }),
    );
    try {
      pico8Validate(pattern, 1);
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Pico8Error);
      const err = error as Pico8Error;
      expect(err.code).toBe('PICO8_TOO_MANY_CHANNELS');
      const details = err.details as Pico8TooManyChannelsDetails;
      expect(details.at).toBe(Time.ZERO.toString());
      expect(details.channels).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('flags the specific later cycle where the collision occurs', () => {
    // cat rotates one subpattern per cycle. Cycle 0 is a safe single
    // channel, cycle 1 adds a second, cycle 2 stacks five distinct
    // channels and must blow up there specifically.
    const safe0 = pure({ pitch: 48 }).ch(0);
    const safe1 = stack(pure({ pitch: 48 }).ch(0), pure({ pitch: 52 }).ch(1));
    const bust2 = stack(
      pure({ pitch: 48 }).ch(0),
      pure({ pitch: 52 }).ch(1),
      pure({ pitch: 55 }).ch(2),
      pure({ pitch: 60 }).ch(3),
      pure({ pitch: 62, ch: 4 as unknown as 0 }),
    );
    const pattern = cat(safe0, safe1, bust2);
    try {
      pico8Validate(pattern, 3);
      expect.fail('expected throw');
    } catch (error) {
      const err = error as Pico8Error;
      expect(err.code).toBe('PICO8_TOO_MANY_CHANNELS');
      const details = err.details as Pico8TooManyChannelsDetails;
      // Collision happens at cycle index 2, which renders as "2".
      expect(details.at).toBe('2');
      expect(details.channels).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('skips silent events (silence yields no channel claims)', () => {
    // silence produces no events, so it doesn't contribute channels.
    const pattern = stack(silence, pure({ pitch: 48 }).ch(0));
    expect(() => {
      pico8Validate(pattern, 1);
    }).not.toThrow();
  });

  it('sorts channel ids ascending in the error payload', () => {
    const pattern = stack(
      pure({ pitch: 48, ch: 3 as unknown as 0 }),
      pure({ pitch: 52, ch: 1 as unknown as 0 }),
      pure({ pitch: 55, ch: 4 as unknown as 0 }),
      pure({ pitch: 60, ch: 0 as const }),
      pure({ pitch: 63, ch: 2 as unknown as 0 }),
    );
    try {
      pico8Validate(pattern, 1);
      expect.fail('expected throw');
    } catch (error) {
      const details = (error as Pico8Error).details as Pico8TooManyChannelsDetails;
      expect(details.channels).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('rejects non-positive cycles with a TypeError', () => {
    const pattern = pure({ pitch: 48 });
    expect(() => {
      pico8Validate(pattern, 0);
    }).toThrow(TypeError);
    expect(() => {
      pico8Validate(pattern, -1);
    }).toThrow(TypeError);
    expect(() => {
      pico8Validate(pattern, 1.5);
    }).toThrow(TypeError);
  });
});
