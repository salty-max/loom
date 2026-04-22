import {
  EFFECT_MAX,
  EFFECT_MIN,
  INSTRUMENT_BUILTIN_MAX,
  INSTRUMENT_MAX,
  INSTRUMENT_MIN,
  type LoopRange,
  MUSIC_CHANNELS_MAX,
  type MusicChannel,
  type MusicPattern,
  type Note,
  PITCH_MAX,
  PITCH_MIN,
  type Rest,
  type Sfx,
  type SfxStep,
  type Song,
  SPEED_MAX,
  SPEED_MIN,
  STEPS_PER_SFX,
  VOLUME_MAX,
  VOLUME_MIN,
} from '@loom/pico8/types.js';
import { describe, expect, it } from 'vitest';

describe('pico8/types', () => {
  describe('range constants', () => {
    it('matches PICO-8 tracker bounds', () => {
      expect(PITCH_MIN).toBe(0);
      expect(PITCH_MAX).toBe(63);
      expect(VOLUME_MIN).toBe(0);
      expect(VOLUME_MAX).toBe(7);
      expect(INSTRUMENT_MIN).toBe(0);
      expect(INSTRUMENT_BUILTIN_MAX).toBe(7);
      expect(INSTRUMENT_MAX).toBe(15);
      expect(EFFECT_MIN).toBe(0);
      expect(EFFECT_MAX).toBe(7);
      expect(SPEED_MIN).toBe(1);
      expect(SPEED_MAX).toBe(255);
      expect(STEPS_PER_SFX).toBe(32);
      expect(MUSIC_CHANNELS_MAX).toBe(4);
    });
  });

  describe('Note and Rest', () => {
    it('Note carries the full attribute set', () => {
      const note: Note = {
        kind: 'note',
        pitch: 48,
        instrument: 0,
        volume: 5,
        effect: 0,
      };
      expect(note.kind).toBe('note');
      expect(note.pitch).toBe(48);
      expect(note.instrument).toBe(0);
      expect(note.volume).toBe(5);
      expect(note.effect).toBe(0);
    });

    it('Rest is the silent step', () => {
      const rest: Rest = { kind: 'rest' };
      expect(rest.kind).toBe('rest');
    });

    it('SfxStep discriminates by kind', () => {
      const steps: SfxStep[] = [
        { kind: 'note', pitch: 0, instrument: 0, volume: 0, effect: 0 },
        { kind: 'rest' },
      ];
      const [first, second] = steps;
      if (first?.kind === 'note') {
        expect(first.pitch).toBe(0);
      } else {
        expect.fail('first step should be a note');
      }
      expect(second?.kind).toBe('rest');
    });
  });

  describe('Sfx', () => {
    it('holds steps and speed', () => {
      const sfx: Sfx = {
        steps: Array.from({ length: STEPS_PER_SFX }, () => ({ kind: 'rest' }) as const),
        speed: 16,
      };
      expect(sfx.steps).toHaveLength(STEPS_PER_SFX);
      expect(sfx.speed).toBe(16);
    });
  });

  describe('MusicChannel', () => {
    it('discriminates between sfx and silence variants', () => {
      const sfx: Sfx = {
        steps: Array.from({ length: STEPS_PER_SFX }, () => ({ kind: 'rest' }) as const),
        speed: 16,
      };
      const channels: MusicChannel[] = [{ kind: 'sfx', sfx }, { kind: 'silence' }];

      const [first, second] = channels;
      if (first?.kind === 'sfx') {
        expect(first.sfx.speed).toBe(16);
      } else {
        expect.fail('first channel should reference the sfx');
      }
      expect(second?.kind).toBe('silence');
    });
  });

  describe('MusicPattern and Song', () => {
    it('MusicPattern holds up to MUSIC_CHANNELS_MAX channels', () => {
      const pattern: MusicPattern = {
        channels: Array.from({ length: MUSIC_CHANNELS_MAX }, () => ({ kind: 'silence' }) as const),
      };
      expect(pattern.channels).toHaveLength(MUSIC_CHANNELS_MAX);
    });

    it('Song without loop plays once', () => {
      const song: Song = { patterns: [{ channels: [] }] };
      expect(song.patterns).toHaveLength(1);
      expect(song.loop).toBeUndefined();
    });

    it('Song with loop carries start/end positions', () => {
      const loop: LoopRange = { start: 1, end: 3 };
      const song: Song = { patterns: [{ channels: [] }, { channels: [] }], loop };
      expect(song.patterns).toHaveLength(2);
      expect(song.loop?.start).toBe(1);
      expect(song.loop?.end).toBe(3);
    });
  });
});
