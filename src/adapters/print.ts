import type { Pattern } from '@loom/core/pattern.js';
import { Time } from '@loom/core/time.js';

/** Default tempo used when {@link PrintOptions.bpm} is omitted. */
export const DEFAULT_BPM = 120;

/** Options accepted by {@link print}. */
export interface PrintOptions {
  /** Positive integer — how many cycles to query. */
  readonly cycles: number;
  /**
   * Tempo in beats per minute. Defaults to {@link DEFAULT_BPM} (120).
   * Wall-clock `beginMs` / `endMs` are computed as
   * `time.toNumber() * 60_000 / bpm`.
   */
  readonly bpm?: number;
  /**
   * Optional sink for the emitted lines. Defaults to `console.log`.
   * Tests and CLI wrappers can redirect by passing a spy.
   */
  readonly sink?: (line: string) => void;
}

/** Shape of one line of output — JSON per line. */
export interface PrintedEvent {
  readonly begin: string;
  readonly end: string;
  readonly value: unknown;
  readonly beginMs: number;
  readonly endMs: number;
}

/**
 * Queries `pattern` over `[0, cycles)` and emits one JSON line per
 * event to `sink` (default `console.log`). Each line carries:
 *
 * - `begin` / `end` rendered via `Time.toString()` (bare integer or
 *   `"num/den"`).
 * - `value` — the event payload verbatim. `Event.context` is
 *   intentionally omitted; it's a debug-only origin hint, not a
 *   consumer-visible field.
 * - `beginMs` / `endMs` — wall-clock timestamps at `bpm` (default 120).
 *
 * Used by `loom events` (#17) and by tests exploring pattern output.
 *
 * @param pattern - Pattern to query
 * @param options - Cycle count, optional bpm, optional sink
 * @throws `TypeError` when `cycles` is not a positive integer or
 *   `bpm` is not a positive finite number
 */
export function print<T>(pattern: Pattern<T>, options: PrintOptions): void {
  const { cycles, bpm = DEFAULT_BPM, sink = console.log } = options;
  if (!Number.isInteger(cycles) || cycles <= 0) {
    throw new TypeError(`print: cycles must be a positive integer, got ${cycles}`);
  }
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new TypeError(`print: bpm must be a positive finite number, got ${bpm}`);
  }

  const events = pattern.query(Time.ZERO, new Time(BigInt(cycles), 1n));
  for (const event of events) {
    const line: PrintedEvent = {
      begin: event.begin.toString(),
      end: event.end.toString(),
      value: event.value,
      beginMs: (event.begin.toNumber() * 60_000) / bpm,
      endMs: (event.end.toNumber() * 60_000) / bpm,
    };
    sink(JSON.stringify(line));
  }
}
