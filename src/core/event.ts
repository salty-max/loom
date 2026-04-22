import type { Time } from '@loom/core/time.js';

/**
 * Context carried alongside an event — origin hints useful for debugging
 * composed patterns. Free-form because transforms decide what's helpful
 * to forward.
 *
 * Conventional keys (producers should prefer these over ad-hoc names):
 * - `origin` — module that produced the event (`'mini'`, `'pure'`, ...)
 * - `span` — `[startChar, endChar]` source span for mini-notation events
 */
export interface EventContext {
  readonly [key: string]: unknown;
}

/**
 * A single unit of output from a pattern query. Holds a half-open time
 * interval `[begin, end)`, the value active over that interval, and an
 * optional context for debugging.
 *
 * Events are immutable — transforms produce new events rather than
 * mutating existing ones.
 */
export interface Event<T> {
  /** Inclusive lower bound in cycles. */
  readonly begin: Time;
  /**
   * Exclusive upper bound in cycles. By convention strictly greater than
   * `begin` — producers (e.g. `Pattern.query`) maintain this; consumers
   * may assume it.
   */
  readonly end: Time;
  /** The value active over `[begin, end)`. */
  readonly value: T;
  /** Optional origin hints propagated by transforms. */
  readonly context?: EventContext;
}
