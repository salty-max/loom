import { INSTRUMENT_BUILTIN_MAX, INSTRUMENT_MIN, type InstrumentId } from '@loom/pico8/types.js';

/**
 * Kebab-case names for the 8 built-in PICO-8 waveforms, ordered by
 * their slot id. Exported as a union so chainable setters in #8 can
 * accept either a numeric id or the name.
 */
export type InstrumentName =
  | 'triangle'
  | 'tilted-saw'
  | 'saw'
  | 'square'
  | 'pulse'
  | 'organ'
  | 'noise'
  | 'phaser';

/** An entry in the built-in instrument table. */
export interface BuiltinInstrument {
  readonly id: InstrumentId;
  readonly name: InstrumentName;
}

/**
 * The 8 built-in PICO-8 waveforms, ordered so `BUILTIN_INSTRUMENTS[id]`
 * yields the matching entry for slots 0-7. Slots 8-15 are reserved
 * for user-defined custom instruments and live outside this table.
 */
export const BUILTIN_INSTRUMENTS: readonly BuiltinInstrument[] = [
  { id: 0, name: 'triangle' },
  { id: 1, name: 'tilted-saw' },
  { id: 2, name: 'saw' },
  { id: 3, name: 'square' },
  { id: 4, name: 'pulse' },
  { id: 5, name: 'organ' },
  { id: 6, name: 'noise' },
  { id: 7, name: 'phaser' },
];

/**
 * Name → id lookup for the 8 built-ins. Kept in sync with
 * `BUILTIN_INSTRUMENTS` at module load so consumers never need to
 * scan the array.
 */
const ID_BY_NAME: ReadonlyMap<InstrumentName, InstrumentId> = new Map(
  BUILTIN_INSTRUMENTS.map(({ id, name }) => [name, id]),
);

/**
 * Whether `id` refers to a built-in waveform slot (0-7). Slots 8-15
 * point at user-defined custom instruments and return `false`.
 *
 * @param id - Instrument slot to classify
 * @returns `true` if `id` is a built-in slot, `false` otherwise
 */
export function isBuiltin(id: InstrumentId): boolean {
  return Number.isInteger(id) && id >= INSTRUMENT_MIN && id <= INSTRUMENT_BUILTIN_MAX;
}

/**
 * Resolves a built-in waveform name to its slot id.
 *
 * @param name - Kebab-case built-in waveform name
 * @returns The matching `InstrumentId` (0-7)
 */
export function instrumentIdFromName(name: InstrumentName): InstrumentId {
  // The Map is built from the exact same name union at module load —
  // `name` is guaranteed to be a key, so the lookup cannot miss.
  return ID_BY_NAME.get(name) as InstrumentId;
}

/**
 * Resolves a built-in slot id to its canonical name, or `undefined`
 * for custom (non-built-in) slots.
 *
 * @param id - Built-in instrument slot (0-7)
 * @returns The matching name, or `undefined` if `id` is not a built-in
 */
export function instrumentNameFromId(id: InstrumentId): InstrumentName | undefined {
  return isBuiltin(id) ? BUILTIN_INSTRUMENTS[id]?.name : undefined;
}
