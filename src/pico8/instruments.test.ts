import {
  BUILTIN_INSTRUMENTS,
  instrumentIdFromName,
  type InstrumentName,
  instrumentNameFromId,
  isBuiltin,
} from '@loom/pico8/instruments.js';
import { describe, expect, it } from 'vitest';

describe('pico8/instruments', () => {
  describe('BUILTIN_INSTRUMENTS', () => {
    it('lists the 8 PICO-8 waveforms in slot order', () => {
      const expected: readonly InstrumentName[] = [
        'triangle',
        'tilted-saw',
        'saw',
        'square',
        'pulse',
        'organ',
        'noise',
        'phaser',
      ];
      expect(BUILTIN_INSTRUMENTS.map((i) => i.name)).toEqual(expected);
    });

    it('assigns consecutive ids 0-7', () => {
      expect(BUILTIN_INSTRUMENTS.map((i) => i.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('is readonly — the array is shaped as readonly', () => {
      // Structural sanity: the exported type is `readonly BuiltinInstrument[]`
      // so `.push` on a consumer-facing binding is a compile-time error.
      // We verify the contents haven't drifted at runtime.
      expect(BUILTIN_INSTRUMENTS).toHaveLength(8);
    });
  });

  describe('isBuiltin', () => {
    it('returns true for slots 0-7', () => {
      for (let id = 0; id <= 7; id++) {
        expect(isBuiltin(id)).toBe(true);
      }
    });

    it('returns false for custom slots 8-15', () => {
      for (let id = 8; id <= 15; id++) {
        expect(isBuiltin(id)).toBe(false);
      }
    });

    it('returns false for out-of-range and non-integer ids', () => {
      expect(isBuiltin(-1)).toBe(false);
      expect(isBuiltin(16)).toBe(false);
      expect(isBuiltin(3.5)).toBe(false);
      expect(isBuiltin(Number.NaN)).toBe(false);
    });
  });

  describe('instrumentIdFromName', () => {
    it('resolves each built-in name to its slot', () => {
      expect(instrumentIdFromName('triangle')).toBe(0);
      expect(instrumentIdFromName('tilted-saw')).toBe(1);
      expect(instrumentIdFromName('saw')).toBe(2);
      expect(instrumentIdFromName('square')).toBe(3);
      expect(instrumentIdFromName('pulse')).toBe(4);
      expect(instrumentIdFromName('organ')).toBe(5);
      expect(instrumentIdFromName('noise')).toBe(6);
      expect(instrumentIdFromName('phaser')).toBe(7);
    });
  });

  describe('instrumentNameFromId', () => {
    it('round-trips each built-in id to its name', () => {
      for (const { id, name } of BUILTIN_INSTRUMENTS) {
        expect(instrumentNameFromId(id)).toBe(name);
      }
    });

    it('returns undefined for custom slots 8-15', () => {
      for (let id = 8; id <= 15; id++) {
        expect(instrumentNameFromId(id)).toBeUndefined();
      }
    });

    it('returns undefined for out-of-range ids', () => {
      expect(instrumentNameFromId(-1)).toBeUndefined();
      expect(instrumentNameFromId(16)).toBeUndefined();
    });
  });
});
