/**
 * Error codes raised by the mini-notation parser. Stable — renaming
 * one is a breaking change.
 */
export type MiniErrorCode = 'MINI_UNKNOWN_TOKEN';

/**
 * Error thrown by the mini-notation parser. Carries a stable `code`
 * and a machine-readable `details` payload naming (for example) the
 * offending token.
 */
export class MiniError extends Error {
  readonly code: MiniErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(code: MiniErrorCode, message: string, details?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = 'MiniError';
    this.code = code;
    this.details = details;
  }
}
