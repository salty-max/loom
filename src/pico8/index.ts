// Importing this module triggers `Pattern.prototype` augmentation —
// after any import of `@loom/pico8`, every `Pattern<T>` instance
// exposes the chainable setters (`.inst`, `.vol`, `.fx`, `.ch`,
// `.speed`, plus their long aliases).
import '@loom/pico8/augment.js';

export type { ChannelIndex, Pico8Attributes } from '@loom/pico8/attributes.js';
export {
  type Effect,
  effectIdFromName,
  type EffectName,
  effectNameFromId,
  EFFECTS,
} from '@loom/pico8/effects.js';
export { Pico8Error, type Pico8ErrorCode } from '@loom/pico8/errors.js';
export {
  BUILTIN_INSTRUMENTS,
  type BuiltinInstrument,
  instrumentIdFromName,
  type InstrumentName,
  instrumentNameFromId,
  isBuiltin,
} from '@loom/pico8/instruments.js';
export {
  EFFECT_MAX,
  EFFECT_MIN,
  type EffectId,
  INSTRUMENT_BUILTIN_MAX,
  INSTRUMENT_MAX,
  INSTRUMENT_MIN,
  type InstrumentId,
  type LoopRange,
  MUSIC_CHANNELS_MAX,
  type MusicChannel,
  type MusicPattern,
  type Note,
  type Pitch,
  PITCH_MAX,
  PITCH_MIN,
  type Rest,
  type Sfx,
  type SfxChannel,
  type SfxStep,
  type SilenceChannel,
  type Song,
  type Speed,
  SPEED_MAX,
  SPEED_MIN,
  STEPS_PER_SFX,
  type Volume,
  VOLUME_MAX,
  VOLUME_MIN,
} from '@loom/pico8/types.js';
export {
  MAX_VALIDATE_CYCLES,
  type Pico8TooManyChannelsDetails,
  pico8Validate,
} from '@loom/pico8/validate.js';
