import type { EffectId, InstrumentId, Pitch, Speed, Volume } from '@loom/pico8/types.js';

/** PICO-8 music channel index. 0-3; anything else fails at adapter time. */
export type ChannelIndex = 0 | 1 | 2 | 3;

/**
 * Attributes a Pattern can carry toward the PICO-8 adapter. Every
 * field is optional — the adapter fills in defaults (volume 5,
 * instrument 0, effect 0, channel 0) when a field is missing.
 *
 * Adapter-facing shape. The chainable setters in `augment.ts` do NOT
 * return `Pattern<Pico8Attributes>` — they produce per-key
 * intersections (`T & { inst: InstrumentId }`, etc.) so each chain
 * step preserves the incremental type, and the rendered shape
 * converges on `Pico8Attributes` at adapter time.
 */
export interface Pico8Attributes {
  readonly pitch?: Pitch;
  readonly inst?: InstrumentId;
  readonly vol?: Volume;
  readonly fx?: EffectId;
  readonly ch?: ChannelIndex;
  readonly speed?: Speed;
}
