/**
 * Rational time — pattern algebra relies on dividing cycles into exact
 * fractions (3 events in 1 cycle = thirds, not 0.333…). Floats would
 * accumulate rounding errors at deep nesting. Represent every instant
 * as a pair (num, den) of bigints to stay exact.
 *
 * One unit of Time = one cycle. Everything else is derived from a BPM
 * at the adapter layer: `realTimeSeconds = cycles * cycleDuration`.
 */
export class Time {
  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    const n = typeof num === 'bigint' ? num : BigInt(num);
    const d = typeof den === 'bigint' ? den : BigInt(den);
    if (d === 0n) {
      throw new Error('Time denominator cannot be zero');
    }

    // Normalize sign to numerator and reduce by gcd for canonical form.
    const sign = d < 0n ? -1n : 1n;
    const abs = d < 0n ? -d : d;
    const g = gcd(n < 0n ? -n : n, abs);
    this.num = (n * sign) / g;
    this.den = abs / g;
  }

  static readonly ZERO = new Time(0n, 1n);
  static readonly ONE = new Time(1n, 1n);

  /**
   * Build a Time from a finite decimal (small denom). Useful for tests
   * and ergonomic code; production parsing stays in rationals.
   */
  static from(value: number): Time {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Time.from: value must be finite, got ${value}`);
    }
    if (Number.isInteger(value)) {
      return new Time(BigInt(value), 1n);
    }
    // Multiply by 10^k to make the value an integer (k up to 12 digits
    // of decimal precision is plenty for musical subdivisions).
    const [, decimals = ''] = value.toString().split('.');
    const k = BigInt(decimals.length);
    const den = 10n ** k;
    const num = BigInt(Math.round(value * Number(den)));
    return new Time(num, den);
  }

  toNumber(): number {
    return Number(this.num) / Number(this.den);
  }

  add(other: Time): Time {
    return new Time(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Time): Time {
    return new Time(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Time): Time {
    return new Time(this.num * other.num, this.den * other.den);
  }

  div(other: Time): Time {
    if (other.num === 0n) {
      throw new Error('Time: division by zero');
    }
    return new Time(this.num * other.den, this.den * other.num);
  }

  eq(other: Time): boolean {
    return this.num === other.num && this.den === other.den;
  }

  lt(other: Time): boolean {
    return this.num * other.den < other.num * this.den;
  }

  lte(other: Time): boolean {
    return this.num * other.den <= other.num * this.den;
  }

  gt(other: Time): boolean {
    return this.num * other.den > other.num * this.den;
  }

  gte(other: Time): boolean {
    return this.num * other.den >= other.num * this.den;
  }

  min(other: Time): Time {
    return this.lte(other) ? this : other;
  }

  max(other: Time): Time {
    return this.gte(other) ? this : other;
  }

  /** Integer part of the time, floored towards negative infinity. */
  floor(): Time {
    // BigInt division truncates toward zero, so adjust for negatives.
    if (this.num >= 0n || this.num % this.den === 0n) {
      return new Time(this.num / this.den, 1n);
    }
    return new Time(this.num / this.den - 1n, 1n);
  }

  /** Fractional part in [0, 1). */
  fract(): Time {
    return this.sub(this.floor());
  }

  toString(): string {
    return this.den === 1n ? this.num.toString() : `${this.num}/${this.den}`;
  }
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x === 0n ? 1n : x;
}
