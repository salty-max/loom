import { parseNoteName } from '@loom/mini/note-name.js';
import { describe, expect, it } from 'vitest';

describe('parseNoteName', () => {
  it('parses natural notes in octave 4 — middle C family', () => {
    expect(parseNoteName('c4')).toBe(60);
    expect(parseNoteName('d4')).toBe(62);
    expect(parseNoteName('e4')).toBe(64);
    expect(parseNoteName('f4')).toBe(65);
    expect(parseNoteName('g4')).toBe(67);
    expect(parseNoteName('a4')).toBe(69);
    expect(parseNoteName('b4')).toBe(71);
  });

  it('parses sharp notes', () => {
    expect(parseNoteName('c#4')).toBe(61);
    expect(parseNoteName('f#4')).toBe(66);
    expect(parseNoteName('a#4')).toBe(70);
  });

  it('is case-insensitive on the note letter', () => {
    expect(parseNoteName('C3')).toBe(48);
    expect(parseNoteName('F#4')).toBe(66);
  });

  it('handles different octaves including negative', () => {
    expect(parseNoteName('c3')).toBe(48);
    expect(parseNoteName('c5')).toBe(72);
    expect(parseNoteName('c0')).toBe(12);
    expect(parseNoteName('c-1')).toBe(0);
  });

  it('returns undefined for unknown tokens', () => {
    expect(parseNoteName('')).toBeUndefined();
    expect(parseNoteName('c')).toBeUndefined(); // missing octave
    expect(parseNoteName('h3')).toBeUndefined(); // invalid letter
    expect(parseNoteName('c##3')).toBeUndefined(); // double sharp
    expect(parseNoteName('c3.5')).toBeUndefined(); // fractional octave
    expect(parseNoteName('3')).toBeUndefined(); // no letter
    expect(parseNoteName('cat')).toBeUndefined(); // not a note
    expect(parseNoteName('~')).toBeUndefined(); // rest marker isn't a note
  });
});
