/**
 * PICO-8 pitch value. Valid range is `0..63` (C-1 up to D#6 in tracker
 * convention). Not a branded type — range checks live at the adapter
 * boundary, not the type layer.
 */
export type Pitch = number;

/** Inclusive min pitch accepted by PICO-8's tracker. */
export const PITCH_MIN = 0;
/** Inclusive max pitch accepted by PICO-8's tracker. */
export const PITCH_MAX = 63;

/**
 * Per-step volume. Valid range is `0..7` — 0 is silent, 7 is peak.
 */
export type Volume = number;

/** Inclusive min volume. `VOLUME_MIN` is silent; `VOLUME_MAX` is peak. */
export const VOLUME_MIN = 0;
/** Inclusive max volume. */
export const VOLUME_MAX = 7;

/**
 * Waveform slot. `0..7` are the built-in instruments (triangle, tilted
 * saw, saw, square, pulse, organ, noise, phaser); `8..15` are reserved
 * for user-defined custom instruments. Populated with names in
 * `instruments.ts` (issue #6).
 */
export type InstrumentId = number;

/** Inclusive min instrument slot. */
export const INSTRUMENT_MIN = 0;
/** Inclusive max instrument slot. Slots 0-7 are built-ins, 8-15 custom. */
export const INSTRUMENT_MAX = 15;
/** Inclusive max built-in instrument slot. */
export const INSTRUMENT_BUILTIN_MAX = 7;

/**
 * Per-step effect column: `0` none, `1` slide, `2` vibrato, `3` drop,
 * `4` fade in, `5` fade out, `6` arp fast, `7` arp slow. Fleshed out
 * with names in `effects.ts` (issue #7).
 */
export type EffectId = number;

/** Inclusive min effect id. */
export const EFFECT_MIN = 0;
/** Inclusive max effect id. */
export const EFFECT_MAX = 7;

/**
 * Playback speed in ticks per step. Valid range is `1..255` — lower
 * is faster, higher is slower.
 */
export type Speed = number;

/** Inclusive min speed. */
export const SPEED_MIN = 1;
/** Inclusive max speed. */
export const SPEED_MAX = 255;

/**
 * A single playable note on an SFX step — pitch, instrument, volume,
 * and effect column.
 */
export interface Note {
  readonly kind: 'note';
  readonly pitch: Pitch;
  readonly instrument: InstrumentId;
  readonly volume: Volume;
  readonly effect: EffectId;
}

/** Silent step — no pitch fires on this tick. */
export interface Rest {
  readonly kind: 'rest';
}

/** One slot in an SFX: either a note or a rest. */
export type SfxStep = Note | Rest;

/** Number of steps in every SFX. PICO-8 fixes this at 32. */
export const STEPS_PER_SFX = 32;

/**
 * A complete SFX — 32 steps plus a speed (ticks per step). The
 * `steps.length === STEPS_PER_SFX` invariant is enforced by the
 * adapter layer at render time, not the type.
 */
export interface Sfx {
  readonly steps: readonly SfxStep[];
  readonly speed: Speed;
}

/** A music-pattern slot that plays a concrete Sfx. */
export interface SfxChannel {
  readonly kind: 'sfx';
  readonly sfx: Sfx;
}

/** A music-pattern slot that stays silent. */
export interface SilenceChannel {
  readonly kind: 'silence';
}

/** One playing slot in a music pattern — either an SFX or silence. */
export type MusicChannel = SfxChannel | SilenceChannel;

/** Number of concurrent music channels PICO-8 supports. */
export const MUSIC_CHANNELS_MAX = 4;

/**
 * A slice of music — up to `MUSIC_CHANNELS_MAX` channels playing in
 * parallel. The `channels.length <= MUSIC_CHANNELS_MAX` invariant is
 * enforced by the adapter layer at render time.
 */
export interface MusicPattern {
  readonly channels: readonly MusicChannel[];
}

/**
 * Optional loop markers on a Song. `start` and `end` are zero-based,
 * **both inclusive**, indices into the song's `patterns` array. Once
 * the scheduler finishes playing the pattern at `end`, the next cycle
 * resumes at `start` and repeats until stopped.
 *
 * Invariant (enforced by `.loop()` in #10): `0 <= start <= end < patterns.length`.
 */
export interface LoopRange {
  readonly start: number;
  readonly end: number;
}

/**
 * A chain of music patterns played in sequence. `loop` is optional —
 * without it the song plays once and ends.
 */
export interface Song {
  readonly patterns: readonly MusicPattern[];
  readonly loop?: LoopRange;
}
