import type { EffectId } from '@loom/pico8/types.js';

/**
 * Kebab-case names for the 8 per-step effect columns, ordered by
 * their slot id. Exported as a union so chainable setters in #8 can
 * accept either a numeric id or the name.
 */
export type EffectName =
  | 'none'
  | 'slide'
  | 'vibrato'
  | 'drop'
  | 'fade-in'
  | 'fade-out'
  | 'arp-fast'
  | 'arp-slow';

/** An entry in the effects table. */
export interface Effect {
  readonly id: EffectId;
  readonly name: EffectName;
}

/**
 * The 8 PICO-8 per-step effects, ordered so `EFFECTS[id]` yields the
 * matching entry. Audio semantics are implemented by adapters; this
 * table only names the slots.
 */
export const EFFECTS: readonly Effect[] = [
  { id: 0, name: 'none' },
  { id: 1, name: 'slide' },
  { id: 2, name: 'vibrato' },
  { id: 3, name: 'drop' },
  { id: 4, name: 'fade-in' },
  { id: 5, name: 'fade-out' },
  { id: 6, name: 'arp-fast' },
  { id: 7, name: 'arp-slow' },
];

/**
 * Name → id lookup for the 8 effects. Kept in sync with `EFFECTS`
 * at module load so consumers never need to scan the array.
 */
const ID_BY_NAME: ReadonlyMap<EffectName, EffectId> = new Map(
  EFFECTS.map(({ id, name }) => [name, id]),
);

/**
 * Resolves an effect name to its slot id.
 *
 * @param name - Kebab-case effect name
 * @returns The matching `EffectId` (0-7)
 */
export function effectIdFromName(name: EffectName): EffectId {
  // The Map is built from the exact same name union at module load —
  // `name` is guaranteed to be a key, so the lookup cannot miss.
  return ID_BY_NAME.get(name) as EffectId;
}

/**
 * Resolves an effect slot id to its canonical name, or `undefined`
 * for out-of-range ids.
 *
 * @param id - Effect slot (0-7)
 * @returns The matching name, or `undefined` if `id` is out of range
 */
export function effectNameFromId(id: EffectId): EffectName | undefined {
  return EFFECTS[id]?.name;
}
