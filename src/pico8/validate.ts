import type { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';
import type { ChannelIndex, Pico8Attributes } from '@loom/pico8/attributes.js';
import { Pico8Error } from '@loom/pico8/errors.js';
import { MUSIC_CHANNELS_MAX } from '@loom/pico8/types.js';

/**
 * Structured payload of a `PICO8_TOO_MANY_CHANNELS` error. `at` is
 * the rational cycle instant (in `"num/den"` form) where the channel
 * collision was detected; `channels` lists the distinct channel ids
 * active at that instant, sorted ascending.
 */
export interface Pico8TooManyChannelsDetails extends Record<string, unknown> {
  readonly at: string;
  readonly channels: readonly ChannelIndex[];
}

/**
 * Walks `pattern` over the first `cycles` cycles and throws
 * `Pico8Error('PICO8_TOO_MANY_CHANNELS')` if any instant has more
 * than `MUSIC_CHANNELS_MAX` distinct channels active simultaneously.
 *
 * Events with no `.ch` attribute default to channel 0. Concurrent
 * same-channel events are allowed — PICO-8's last-hit-wins semantics
 * means the actual render collapses them.
 *
 * Pre-flight check; the adapter layer calls this (or an equivalent
 * streaming variant) at render time. CLI workflows use it too —
 * `loom events` warns before emitting.
 *
 * @param pattern - Pattern whose events carry an optional `ch` attribute
 * @param cycles - Positive integer — how many cycles to validate
 * @throws `Pico8Error('PICO8_TOO_MANY_CHANNELS')` on collision
 */
export function pico8Validate(pattern: Pattern<Pico8Attributes>, cycles: number): void {
  if (!Number.isInteger(cycles) || cycles <= 0) {
    throw new TypeError(`pico8Validate: cycles must be a positive integer, got ${cycles}`);
  }

  const events = pattern.query(Time.ZERO, new Time(BigInt(cycles), 1n));

  // Distinct-channel set per begin instant. Same-channel collisions
  // collapse into a single set member; only distinct-channel pileups
  // can exceed the four-voice ceiling.
  const channelsByInstant = new Map<string, Set<ChannelIndex>>();
  for (const event of events) {
    const ch = event.value.ch ?? 0;
    const key = event.begin.toString();
    let bucket = channelsByInstant.get(key);
    if (bucket === undefined) {
      bucket = new Set<ChannelIndex>();
      channelsByInstant.set(key, bucket);
    }
    bucket.add(ch);
  }

  for (const [at, bucket] of channelsByInstant) {
    if (bucket.size > MUSIC_CHANNELS_MAX) {
      const channels = [...bucket].toSorted((a, b) => a - b);
      const details: Pico8TooManyChannelsDetails = { at, channels };
      throw new Pico8Error(
        'PICO8_TOO_MANY_CHANNELS',
        `More than ${MUSIC_CHANNELS_MAX} distinct channels collide at cycle ${at}: [${channels.join(', ')}]`,
        details,
      );
    }
  }
}
