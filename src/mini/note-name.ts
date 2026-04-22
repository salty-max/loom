// Semitone offset from C for each note letter. Typed as a const
// mapping so `letter` (typed as a key of this object) produces a
// definite `number` on index — no defensive `undefined` branches.
const LETTER_TO_SEMITONE = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
} as const;

type NoteLetter = keyof typeof LETTER_TO_SEMITONE;

// Note letter, optional sharp accidental, octave (possibly negative).
// The letter class `[a-g]` is exactly the key set of LETTER_TO_SEMITONE.
const NOTE_PATTERN = /^([a-g])(#?)(-?\d+)$/;

/**
 * Parses a note-name token into a MIDI pitch (C4 = 60).
 *
 * Accepted syntax: `<letter><accidental?><octave>`, where:
 * - `<letter>` is `a..g` (case-insensitive)
 * - `<accidental>` is `#` (sharp) — optional. Flats are not yet
 *   supported; callers who need `Eb3` write `d#3` instead.
 * - `<octave>` is an integer, possibly negative
 *
 * @param token - Candidate note-name token (e.g. `"c3"`, `"f#4"`, `"c-1"`)
 * @returns The MIDI pitch, or `undefined` if `token` isn't a valid note name
 */
export function parseNoteName(token: string): number | undefined {
  const match = NOTE_PATTERN.exec(token.toLowerCase());
  if (match === null) {
    return undefined;
  }
  // Three mandatory capture groups — a successful match always
  // populates all of them. `letter` is guaranteed to be in [a-g] by
  // the letter class, so it's safely narrowed to `NoteLetter`.
  const letter = match[1] as NoteLetter;
  const sharp = match[2] as '' | '#';
  const octaveStr = match[3] as string;
  const octave = Number.parseInt(octaveStr, 10);
  return (octave + 1) * 12 + LETTER_TO_SEMITONE[letter] + (sharp === '#' ? 1 : 0);
}
