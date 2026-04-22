import {
  effectIdFromName,
  type EffectName,
  effectNameFromId,
  EFFECTS,
} from '@loom/pico8/effects.js';
import { describe, expect, it } from 'vitest';

describe('pico8/effects', () => {
  describe('EFFECTS', () => {
    it('lists the 8 PICO-8 effects in slot order', () => {
      const expected: readonly EffectName[] = [
        'none',
        'slide',
        'vibrato',
        'drop',
        'fade-in',
        'fade-out',
        'arp-fast',
        'arp-slow',
      ];
      expect(EFFECTS.map((e) => e.name)).toEqual(expected);
    });

    it('assigns consecutive ids 0-7', () => {
      expect(EFFECTS.map((e) => e.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('is length 8', () => {
      expect(EFFECTS).toHaveLength(8);
    });
  });

  describe('effectIdFromName', () => {
    it('resolves each name to its slot', () => {
      expect(effectIdFromName('none')).toBe(0);
      expect(effectIdFromName('slide')).toBe(1);
      expect(effectIdFromName('vibrato')).toBe(2);
      expect(effectIdFromName('drop')).toBe(3);
      expect(effectIdFromName('fade-in')).toBe(4);
      expect(effectIdFromName('fade-out')).toBe(5);
      expect(effectIdFromName('arp-fast')).toBe(6);
      expect(effectIdFromName('arp-slow')).toBe(7);
    });
  });

  describe('effectNameFromId', () => {
    it('round-trips each id to its name', () => {
      for (const { id, name } of EFFECTS) {
        expect(effectNameFromId(id)).toBe(name);
      }
    });

    it('returns undefined for out-of-range ids', () => {
      expect(effectNameFromId(-1)).toBeUndefined();
      expect(effectNameFromId(8)).toBeUndefined();
    });
  });
});
