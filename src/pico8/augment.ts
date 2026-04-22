import type { Event } from '@loom/core/event.js';
import { Pattern } from '@loom/core/pattern.js';
import type { Time } from '@loom/core/time.js';
import type { ChannelIndex } from '@loom/pico8/attributes.js';
import { effectIdFromName, type EffectName, EFFECTS } from '@loom/pico8/effects.js';
import { Pico8Error } from '@loom/pico8/errors.js';
import {
  BUILTIN_INSTRUMENTS,
  instrumentIdFromName,
  type InstrumentName,
} from '@loom/pico8/instruments.js';
import type { EffectId, InstrumentId, Speed, Volume } from '@loom/pico8/types.js';

declare module '@loom/core/pattern.js' {
  // The `this: Pattern<T & object>` constraint on every setter rules
  // out calls on a Pattern of primitives. Spreading a primitive to
  // merge attributes silently discards it (`{...48}` is `{}`), which
  // would be a footgun — every setter requires an object-shaped value.
  // If T is already object-like, `T & object` is T; if T is a
  // primitive or `never`, `T & object` collapses to `never` and the
  // receiver type rejects the call at compile time.
  interface Pattern<T> {
    /**
     * Sets the PICO-8 waveform/instrument for every event. Accepts a
     * numeric slot id (0-15), a built-in name (`'triangle'`, ...), or
     * a `Pattern<InstrumentId>` that zips per step.
     *
     * Invalid string names throw `Pico8Error('PICO8_UNKNOWN_INSTRUMENT')`.
     */
    inst(
      this: Pattern<T & object>,
      value: InstrumentId | InstrumentName | Pattern<InstrumentId>,
    ): Pattern<T & { inst: InstrumentId }>;
    /** Long alias for {@link Pattern.inst}. */
    instrument(
      this: Pattern<T & object>,
      value: InstrumentId | InstrumentName | Pattern<InstrumentId>,
    ): Pattern<T & { inst: InstrumentId }>;

    /**
     * Sets the volume (0-7) for every event. Accepts a number or a
     * `Pattern<Volume>` that zips per step. Range validation happens
     * at the adapter boundary.
     */
    vol(this: Pattern<T & object>, value: Volume | Pattern<Volume>): Pattern<T & { vol: Volume }>;
    /** Long alias for {@link Pattern.vol}. */
    volume(
      this: Pattern<T & object>,
      value: Volume | Pattern<Volume>,
    ): Pattern<T & { vol: Volume }>;

    /**
     * Sets the per-step effect for every event. Accepts a numeric
     * effect id (0-7), a kebab-case name (`'slide'`, `'fade-in'`, ...),
     * or a `Pattern<EffectId>` that zips per step.
     *
     * Invalid string names throw `Pico8Error('PICO8_UNKNOWN_EFFECT')`.
     */
    fx(
      this: Pattern<T & object>,
      value: EffectId | EffectName | Pattern<EffectId>,
    ): Pattern<T & { fx: EffectId }>;
    /** Long alias for {@link Pattern.fx}. */
    effect(
      this: Pattern<T & object>,
      value: EffectId | EffectName | Pattern<EffectId>,
    ): Pattern<T & { fx: EffectId }>;

    /**
     * Assigns a PICO-8 music channel (0-3) to every event. Range is
     * enforced at the type level since there are only four channels.
     */
    ch(this: Pattern<T & object>, value: ChannelIndex): Pattern<T & { ch: ChannelIndex }>;
    /** Long alias for {@link Pattern.ch}. */
    channel(this: Pattern<T & object>, value: ChannelIndex): Pattern<T & { ch: ChannelIndex }>;

    /**
     * Sets the SFX playback speed (1-255 ticks per step) for every
     * event. Range validation happens at the adapter boundary.
     */
    speed(this: Pattern<T & object>, value: Speed): Pattern<T & { speed: Speed }>;
  }
}

const BUILTIN_INSTRUMENT_NAMES: ReadonlySet<string> = new Set(
  BUILTIN_INSTRUMENTS.map((i) => i.name),
);
const EFFECT_NAMES: ReadonlySet<string> = new Set(EFFECTS.map((e) => e.name));

function isInstrumentName(value: unknown): value is InstrumentName {
  return typeof value === 'string' && BUILTIN_INSTRUMENT_NAMES.has(value);
}

function isEffectName(value: unknown): value is EffectName {
  return typeof value === 'string' && EFFECT_NAMES.has(value);
}

function resolveInstrument(value: InstrumentId | InstrumentName): InstrumentId {
  if (typeof value === 'number') {
    return value;
  }
  if (!isInstrumentName(value)) {
    throw new Pico8Error(
      'PICO8_UNKNOWN_INSTRUMENT',
      `Unknown instrument name: ${JSON.stringify(value)}`,
    );
  }
  return instrumentIdFromName(value);
}

function resolveEffect(value: EffectId | EffectName): EffectId {
  if (typeof value === 'number') {
    return value;
  }
  if (!isEffectName(value)) {
    throw new Pico8Error('PICO8_UNKNOWN_EFFECT', `Unknown effect name: ${JSON.stringify(value)}`);
  }
  return effectIdFromName(value);
}

function isPattern<T>(value: unknown): value is Pattern<T> {
  return value instanceof Pattern;
}

/**
 * For each event in `base`, find a value active at the event's begin
 * time and merge it into the event's value. Events with no value
 * covering their begin instant are dropped — the value pattern
 * "structures" which events survive.
 */
function zipPatternValue<A extends object, B, C extends object>(
  base: Pattern<A>,
  values: Pattern<B>,
  merge: (eventValue: A, attrValue: B) => C,
): Pattern<C> {
  return new Pattern<C>((begin, end) => {
    const baseEvents = base.query(begin, end);
    if (baseEvents.length === 0) {
      return [];
    }
    // Extend the value-query window to cover every base event's end.
    let maxEnd: Time = end;
    for (const event of baseEvents) {
      if (event.end.gt(maxEnd)) {
        maxEnd = event.end;
      }
    }
    const valueEvents = values.query(begin, maxEnd);
    return baseEvents.flatMap((event) => {
      const active = valueEvents.find((ve) => ve.begin.lte(event.begin) && ve.end.gt(event.begin));
      if (active === undefined) {
        return [];
      }
      const next: Event<C> = {
        begin: event.begin,
        end: event.end,
        value: merge(event.value, active.value),
        ...(event.context === undefined ? {} : { context: event.context }),
      };
      return [next];
    });
  });
}

// The augment-time cast to a wide-open signature lets us ignore the
// precise T in implementation; the declare-module block above is what
// gives consumers their sharp types.
type AnySetter = (value: unknown) => unknown;

Pattern.prototype.inst = function inst<T extends object>(
  this: Pattern<T>,
  value: InstrumentId | InstrumentName | Pattern<InstrumentId>,
): Pattern<T & { inst: InstrumentId }> {
  if (isPattern<InstrumentId>(value)) {
    return zipPatternValue(this, value, (v, id) => ({ ...v, inst: id }));
  }
  const id = resolveInstrument(value);
  return this.map((v) => ({ ...v, inst: id }));
} as AnySetter as Pattern<object>['inst'];

Pattern.prototype.instrument = function instrument<T extends object>(
  this: Pattern<T>,
  value: InstrumentId | InstrumentName | Pattern<InstrumentId>,
): Pattern<T & { inst: InstrumentId }> {
  return this.inst(value);
} as AnySetter as Pattern<object>['instrument'];

Pattern.prototype.vol = function vol<T extends object>(
  this: Pattern<T>,
  value: Volume | Pattern<Volume>,
): Pattern<T & { vol: Volume }> {
  if (isPattern<Volume>(value)) {
    return zipPatternValue(this, value, (v, n) => ({ ...v, vol: n }));
  }
  return this.map((v) => ({ ...v, vol: value }));
} as AnySetter as Pattern<object>['vol'];

Pattern.prototype.volume = function volume<T extends object>(
  this: Pattern<T>,
  value: Volume | Pattern<Volume>,
): Pattern<T & { vol: Volume }> {
  return this.vol(value);
} as AnySetter as Pattern<object>['volume'];

Pattern.prototype.fx = function fx<T extends object>(
  this: Pattern<T>,
  value: EffectId | EffectName | Pattern<EffectId>,
): Pattern<T & { fx: EffectId }> {
  if (isPattern<EffectId>(value)) {
    return zipPatternValue(this, value, (v, id) => ({ ...v, fx: id }));
  }
  const id = resolveEffect(value);
  return this.map((v) => ({ ...v, fx: id }));
} as AnySetter as Pattern<object>['fx'];

Pattern.prototype.effect = function effect<T extends object>(
  this: Pattern<T>,
  value: EffectId | EffectName | Pattern<EffectId>,
): Pattern<T & { fx: EffectId }> {
  return this.fx(value);
} as AnySetter as Pattern<object>['effect'];

Pattern.prototype.ch = function ch<T extends object>(
  this: Pattern<T>,
  value: ChannelIndex,
): Pattern<T & { ch: ChannelIndex }> {
  return this.map((v) => ({ ...v, ch: value }));
} as AnySetter as Pattern<object>['ch'];

Pattern.prototype.channel = function channel<T extends object>(
  this: Pattern<T>,
  value: ChannelIndex,
): Pattern<T & { ch: ChannelIndex }> {
  return this.ch(value);
} as AnySetter as Pattern<object>['channel'];

Pattern.prototype.speed = function speed<T extends object>(
  this: Pattern<T>,
  value: Speed,
): Pattern<T & { speed: Speed }> {
  return this.map((v) => ({ ...v, speed: value }));
} as AnySetter as Pattern<object>['speed'];
