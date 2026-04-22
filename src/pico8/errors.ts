/**
 * Error codes surfaced by the PICO-8 layer. Each code names a specific
 * validation failure so callers can programmatically discriminate
 * between (e.g.) "you passed an unknown instrument name" and "you
 * stacked too many channels".
 *
 * Codes are stable — renaming one is a breaking change.
 */
export type Pico8ErrorCode =
  | 'PICO8_UNKNOWN_INSTRUMENT'
  | 'PICO8_UNKNOWN_EFFECT'
  | 'PICO8_INVALID_PITCH'
  | 'PICO8_INVALID_VOLUME'
  | 'PICO8_INVALID_SPEED'
  | 'PICO8_TOO_MANY_CHANNELS'
  | 'PICO8_SONG_LOOP_OUT_OF_RANGE';

/**
 * Error thrown by the PICO-8 layer. Carries a stable `code`, a
 * human-readable message, and an optional `details` payload with
 * machine-readable context (e.g. `{ at: cycle, channels: [...] }`
 * for `PICO8_TOO_MANY_CHANNELS`).
 */
export class Pico8Error extends Error {
  readonly code: Pico8ErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(code: Pico8ErrorCode, message: string, details?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = 'Pico8Error';
    this.code = code;
    this.details = details;
  }
}
