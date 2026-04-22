import { fileURLToPath } from 'node:url';

import { runEvents } from '@loom/cli/events.js';
import { describe, expect, it, vi } from 'vitest';

const FIXTURES = fileURLToPath(new URL('__fixtures__/', import.meta.url));

function captured(): {
  sinks: { stdout: (line: string) => void; stderr: (line: string) => void };
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    sinks: {
      stdout: (line) => {
        stdout.push(line);
      },
      stderr: (line) => {
        stderr.push(line);
      },
    },
    stdout,
    stderr,
  };
}

describe('runEvents', () => {
  it('prints one JSON line per event and exits 0', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}simple.ts`], sinks);

    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout).toHaveLength(2);
    expect(JSON.parse(stdout[0] ?? '')).toMatchObject({ begin: '0', end: '1/2', value: 'a' });
    expect(JSON.parse(stdout[1] ?? '')).toMatchObject({ begin: '1/2', end: '1', value: 'b' });
  });

  it('respects --cycles', async () => {
    const { sinks, stdout } = captured();
    const code = await runEvents([`${FIXTURES}simple.ts`, '--cycles', '2'], sinks);

    expect(code).toBe(0);
    expect(stdout).toHaveLength(4);
  });

  it('respects --bpm for ms timestamps', async () => {
    const { sinks, stdout } = captured();
    const code = await runEvents([`${FIXTURES}simple.ts`, '--bpm', '60'], sinks);

    expect(code).toBe(0);
    // At 60 bpm, one cycle = 1000ms, each half = 500ms.
    expect(JSON.parse(stdout[0] ?? '')).toMatchObject({ beginMs: 0, endMs: 500 });
    expect(JSON.parse(stdout[1] ?? '')).toMatchObject({ beginMs: 500, endMs: 1000 });
  });

  it('exits 1 with an arg-parse error on malformed flags', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}simple.ts`, '--cycles', 'abc'], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr).toHaveLength(1);
    expect(stderr[0]).toContain('--cycles must be a positive integer');
  });

  it('exits 1 with a clear message when the file cannot be loaded', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}does-not-exist.ts`], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('failed to load');
    expect(stderr[0]).toContain('does-not-exist.ts');
  });

  it("exits 1 when the file's default export is not a Pattern", async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}not-a-pattern.ts`], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('must default-export a Pattern');
  });

  it('exits 1 with no stdout output on missing file argument', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('missing <file>');
  });

  it('exits 1 when the default-exported Pattern throws at query time', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}throwing-pattern.ts`], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('boom');
  });

  it('exits 1 when the file throws at module load time', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}throws-at-import.ts`], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('failed to load');
    expect(stderr[0]).toContain('boom-at-import');
  });

  it('exits 1 when the file has no default export', async () => {
    const { sinks, stdout, stderr } = captured();
    const code = await runEvents([`${FIXTURES}no-default-export.ts`], sinks);

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('must default-export a Pattern');
    expect(stderr[0]).toContain('got undefined');
  });

  it('writes to process.stdout / process.stderr by default when no sinks injected', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      // Happy path hits the default stdout sink.
      const okCode = await runEvents([`${FIXTURES}simple.ts`]);
      expect(okCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();

      stdoutSpy.mockClear();
      stderrSpy.mockClear();

      // Error path hits the default stderr sink.
      const errCode = await runEvents([]);
      expect(errCode).toBe(1);
      expect(stderrSpy).toHaveBeenCalled();
    } finally {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    }
  });
});
