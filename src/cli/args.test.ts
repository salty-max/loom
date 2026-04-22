import { parseEventsArgs } from '@loom/cli/args.js';
import { describe, expect, it } from 'vitest';

describe('parseEventsArgs', () => {
  it('parses a lone file argument with defaults', () => {
    expect(parseEventsArgs(['song.loom.ts'])).toEqual({ file: 'song.loom.ts', cycles: 1 });
  });

  it('parses --cycles after the file', () => {
    expect(parseEventsArgs(['song.loom.ts', '--cycles', '4'])).toEqual({
      file: 'song.loom.ts',
      cycles: 4,
    });
  });

  it('parses --bpm after the file', () => {
    expect(parseEventsArgs(['song.loom.ts', '--bpm', '140'])).toEqual({
      file: 'song.loom.ts',
      cycles: 1,
      bpm: 140,
    });
  });

  it('parses both flags in either order', () => {
    expect(parseEventsArgs(['song.loom.ts', '--cycles', '3', '--bpm', '120'])).toEqual({
      file: 'song.loom.ts',
      cycles: 3,
      bpm: 120,
    });
    expect(parseEventsArgs(['song.loom.ts', '--bpm', '120', '--cycles', '3'])).toEqual({
      file: 'song.loom.ts',
      cycles: 3,
      bpm: 120,
    });
  });

  it('rejects a missing file', () => {
    expect(parseEventsArgs([])).toEqual({ error: 'missing <file> argument' });
    expect(parseEventsArgs(['--cycles', '2'])).toEqual({ error: 'missing <file> argument' });
  });

  it('rejects --cycles without a value', () => {
    expect(parseEventsArgs(['song.loom.ts', '--cycles'])).toEqual({
      error: '--cycles requires a value',
    });
  });

  it('rejects --bpm without a value', () => {
    expect(parseEventsArgs(['song.loom.ts', '--bpm'])).toEqual({
      error: '--bpm requires a value',
    });
  });

  it('rejects non-positive / non-integer --cycles', () => {
    for (const bad of ['0', '1.5', 'abc']) {
      const result = parseEventsArgs(['song.loom.ts', '--cycles', bad]);
      expect('error' in result && result.error).toMatch(/positive integer/);
    }
  });

  it('rejects non-positive / non-finite --bpm', () => {
    for (const bad of ['0', '-120', 'abc']) {
      const result = parseEventsArgs(['song.loom.ts', '--bpm', bad]);
      expect('error' in result && result.error).toMatch(/positive finite/);
    }
  });

  it('rejects unknown flags', () => {
    expect(parseEventsArgs(['song.loom.ts', '--nope'])).toEqual({
      error: 'unknown flag --nope',
    });
  });

  it('rejects a second positional argument', () => {
    const result = parseEventsArgs(['song.loom.ts', 'other.loom.ts']);
    expect('error' in result && result.error).toMatch(/unexpected positional/);
  });
});
