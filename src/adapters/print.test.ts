import { DEFAULT_BPM, print } from '@loom/adapters/print.js';
import { Pattern } from '@loom/core/pattern.js';
import { pure, seq, silence } from '@loom/core/primitives.js';
import { Time } from '@loom/core/time.js';
import { describe, expect, it, vi } from 'vitest';

function captured(): { sink: (line: string) => void; lines: string[] } {
  const lines: string[] = [];
  return {
    sink: (line) => {
      lines.push(line);
    },
    lines,
  };
}

describe('print', () => {
  it('emits one JSON line per event with Time.toString() formatting and default-bpm ms', () => {
    const { sink, lines } = captured();
    print(seq(pure('a'), pure('b')), { cycles: 1, sink });

    expect(lines).toHaveLength(2);
    // Default bpm is 120 → one cycle = 500ms, so each half spans 250ms.
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      begin: '0',
      end: '1/2',
      value: 'a',
      beginMs: 0,
      endMs: 250,
    });
    expect(JSON.parse(lines[1] ?? '')).toEqual({
      begin: '1/2',
      end: '1',
      value: 'b',
      beginMs: 250,
      endMs: 500,
    });
  });

  it('renders integer Time values as bare integers, not "n/1"', () => {
    const { sink, lines } = captured();
    print(pure('x'), { cycles: 1, sink });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      begin: '0',
      end: '1',
      value: 'x',
    });
  });

  it('queries N cycles when cycles=N', () => {
    const { sink, lines } = captured();
    print(pure('x'), { cycles: 3, sink });

    expect(lines).toHaveLength(3);
    const times = lines.map((l) => JSON.parse(l) as { begin: string; end: string });
    expect(times.map((t) => t.begin)).toEqual(['0', '1', '2']);
    expect(times.map((t) => t.end)).toEqual(['1', '2', '3']);
  });

  it('emits nothing for silence', () => {
    const { sink, lines } = captured();
    print(silence, { cycles: 2, sink });
    expect(lines).toEqual([]);
  });

  it('preserves complex value shapes verbatim', () => {
    const { sink, lines } = captured();
    print(pure({ pitch: 48, vol: 5 }), { cycles: 1, sink });

    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      begin: '0',
      end: '1',
      value: { pitch: 48, vol: 5 },
    });
  });

  it('drops Event.context — it is a debug-only field, not part of the stream', () => {
    // Lock the behaviour: even when the underlying Pattern carries a
    // context, the printed line never surfaces it.
    const source = new Pattern<string>(() => [
      { begin: Time.ZERO, end: Time.ONE, value: 'x', context: { origin: 'mini' } },
    ]);
    const { sink, lines } = captured();
    print(source, { cycles: 1, sink });

    const parsed = JSON.parse(lines[0] ?? '') as Record<string, unknown>;
    expect(parsed).not.toHaveProperty('context');
  });

  describe('bpm option', () => {
    it('DEFAULT_BPM is 120', () => {
      expect(DEFAULT_BPM).toBe(120);
    });

    it('scales correctly at non-default bpm', () => {
      const { sink, lines } = captured();
      // At 60 bpm, one cycle = 1000ms.
      print(pure('x'), { cycles: 2, bpm: 60, sink });

      expect(JSON.parse(lines[0] ?? '')).toMatchObject({ beginMs: 0, endMs: 1000 });
      expect(JSON.parse(lines[1] ?? '')).toMatchObject({ beginMs: 1000, endMs: 2000 });
    });

    it('produces 500ms-per-cycle at the default of 120 bpm', () => {
      const { sink, lines } = captured();
      print(pure('x'), { cycles: 2, sink });

      expect(JSON.parse(lines[0] ?? '')).toMatchObject({ beginMs: 0, endMs: 500 });
      expect(JSON.parse(lines[1] ?? '')).toMatchObject({ beginMs: 500, endMs: 1000 });
    });
  });

  describe('validation', () => {
    it('rejects non-positive / non-integer cycles', () => {
      for (const bad of [0, -1, 1.5, Number.NaN]) {
        expect(() => {
          print(pure('x'), { cycles: bad });
        }).toThrow(TypeError);
      }
    });

    it('rejects non-positive or non-finite bpm', () => {
      for (const bad of [0, -120, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => {
          print(pure('x'), { cycles: 1, bpm: bad });
        }).toThrow(TypeError);
      }
    });
  });

  it('defaults the sink to console.log when not provided', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      print(pure('x'), { cycles: 1 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '{"begin":"0","end":"1","value":"x","beginMs":0,"endMs":500}',
      );
    } finally {
      spy.mockRestore();
    }
  });
});
