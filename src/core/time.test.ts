import { Time } from '@loom/core/time.js';
import { describe, expect, it } from 'vitest';

describe('Time', () => {
  describe('construction', () => {
    it('normalizes to canonical form via gcd reduction', () => {
      const t = new Time(4n, 8n);
      expect(t.num).toBe(1n);
      expect(t.den).toBe(2n);
    });

    it('accepts number literals', () => {
      const t = new Time(3, 4);
      expect(t.num).toBe(3n);
      expect(t.den).toBe(4n);
    });

    it('defaults denominator to 1', () => {
      const t = new Time(5n);
      expect(t.num).toBe(5n);
      expect(t.den).toBe(1n);
    });

    it('moves negative sign to the numerator', () => {
      const t = new Time(1n, -2n);
      expect(t.num).toBe(-1n);
      expect(t.den).toBe(2n);
    });

    it('keeps a negative numerator negative', () => {
      const t = new Time(-3n, 4n);
      expect(t.num).toBe(-3n);
      expect(t.den).toBe(4n);
    });

    it('reduces two negatives to a positive', () => {
      const t = new Time(-2n, -4n);
      expect(t.num).toBe(1n);
      expect(t.den).toBe(2n);
    });

    it('rejects a zero denominator', () => {
      expect(() => new Time(1n, 0n)).toThrow('Time denominator cannot be zero');
    });
  });

  describe('constants', () => {
    it('exposes ZERO and ONE', () => {
      expect(Time.ZERO.num).toBe(0n);
      expect(Time.ZERO.den).toBe(1n);
      expect(Time.ONE.num).toBe(1n);
      expect(Time.ONE.den).toBe(1n);
    });
  });

  describe('Time.from', () => {
    it('handles integers', () => {
      const t = Time.from(5);
      expect(t.eq(new Time(5n, 1n))).toBe(true);
    });

    it('handles finite decimals', () => {
      const t = Time.from(0.25);
      expect(t.eq(new Time(1n, 4n))).toBe(true);
    });

    it('handles negative decimals', () => {
      const t = Time.from(-0.5);
      expect(t.eq(new Time(-1n, 2n))).toBe(true);
    });

    it('preserves ~12 digits of decimal precision', () => {
      const t = Time.from(0.123_456_789_012);
      expect(t.eq(new Time(123_456_789_012n, 10n ** 12n))).toBe(true);
    });

    it('rejects non-finite values', () => {
      expect(() => Time.from(Number.NaN)).toThrow(TypeError);
      expect(() => Time.from(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    });
  });

  describe('arithmetic', () => {
    it('add', () => {
      expect(new Time(1n, 4n).add(new Time(1n, 2n)).eq(new Time(3n, 4n))).toBe(true);
    });

    it('sub', () => {
      expect(new Time(3n, 4n).sub(new Time(1n, 2n)).eq(new Time(1n, 4n))).toBe(true);
    });

    it('mul', () => {
      expect(new Time(2n, 3n).mul(new Time(3n, 4n)).eq(new Time(1n, 2n))).toBe(true);
    });

    it('div', () => {
      expect(new Time(1n, 2n).div(new Time(1n, 4n)).eq(new Time(2n, 1n))).toBe(true);
    });

    it('rejects division by a zero numerator', () => {
      expect(() => Time.ONE.div(Time.ZERO)).toThrow('division by zero');
    });
  });

  describe('comparison', () => {
    const a = new Time(1n, 4n);
    const b = new Time(1n, 2n);
    const aCopy = new Time(2n, 8n);

    it('eq', () => {
      expect(a.eq(aCopy)).toBe(true);
      expect(a.eq(b)).toBe(false);
    });

    it('lt / lte', () => {
      expect(a.lt(b)).toBe(true);
      expect(a.lt(aCopy)).toBe(false);
      expect(a.lte(aCopy)).toBe(true);
      expect(b.lte(a)).toBe(false);
    });

    it('gt / gte', () => {
      expect(b.gt(a)).toBe(true);
      expect(a.gt(aCopy)).toBe(false);
      expect(a.gte(aCopy)).toBe(true);
      expect(a.gte(b)).toBe(false);
    });

    it('min / max', () => {
      expect(a.min(b).eq(a)).toBe(true);
      expect(a.max(b).eq(b)).toBe(true);
      expect(b.min(a).eq(a)).toBe(true);
      expect(b.max(a).eq(b)).toBe(true);
      expect(a.min(aCopy).eq(a)).toBe(true);
      expect(a.max(aCopy).eq(a)).toBe(true);
    });
  });

  describe('very large values', () => {
    it('stays exact beyond Number.MAX_SAFE_INTEGER via bigint arithmetic', () => {
      const big = new Time(10n ** 30n, 10n ** 15n);
      expect(big.eq(new Time(10n ** 15n, 1n))).toBe(true);
    });

    it('preserves precision when adding two huge fractions', () => {
      const a = new Time(10n ** 20n + 1n, 10n ** 20n);
      const b = new Time(1n, 10n ** 20n);
      expect(a.add(b).eq(new Time(10n ** 20n + 2n, 10n ** 20n))).toBe(true);
    });
  });

  describe('floor and fract', () => {
    it('floors a positive fractional time toward zero', () => {
      expect(new Time(7n, 4n).floor().eq(new Time(1n, 1n))).toBe(true);
    });

    it('floors a negative fractional time toward negative infinity', () => {
      expect(new Time(-7n, 4n).floor().eq(new Time(-2n, 1n))).toBe(true);
    });

    it('leaves integers unchanged', () => {
      expect(new Time(3n, 1n).floor().eq(new Time(3n, 1n))).toBe(true);
      expect(new Time(-3n, 1n).floor().eq(new Time(-3n, 1n))).toBe(true);
    });

    it('returns the fractional part in [0, 1)', () => {
      expect(new Time(7n, 4n).fract().eq(new Time(3n, 4n))).toBe(true);
      expect(new Time(-7n, 4n).fract().eq(new Time(1n, 4n))).toBe(true);
      expect(new Time(3n, 1n).fract().eq(Time.ZERO)).toBe(true);
    });
  });

  describe('toNumber and toString', () => {
    it('converts to number', () => {
      expect(new Time(1n, 4n).toNumber()).toBe(0.25);
      expect(new Time(5n, 1n).toNumber()).toBe(5);
    });

    it('renders integers bare', () => {
      expect(new Time(5n, 1n).toString()).toBe('5');
      expect(new Time(-5n, 1n).toString()).toBe('-5');
    });

    it('renders fractions as "num/den"', () => {
      expect(new Time(3n, 4n).toString()).toBe('3/4');
      expect(new Time(-1n, 2n).toString()).toBe('-1/2');
    });
  });
});
