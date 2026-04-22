import { Pattern } from '@loom/core/pattern.js';
import { fast } from '@loom/transforms/fast.js';
import { rev } from '@loom/transforms/rev.js';
import { slow } from '@loom/transforms/slow.js';

declare module '@loom/core/pattern.js' {
  interface Pattern<T> {
    /**
     * Compresses the pattern into `1/n` of its duration. See
     * {@link import('@loom/transforms/fast.js').fast fast}.
     */
    fast(n: number): Pattern<T>;
    /**
     * Stretches the pattern to `n×` its duration. See
     * {@link import('@loom/transforms/slow.js').slow slow}.
     */
    slow(n: number): Pattern<T>;
    /**
     * Reverses the event order within each cycle. See
     * {@link import('@loom/transforms/rev.js').rev rev}.
     */
    rev(): Pattern<T>;
  }
}

Pattern.prototype.fast = function fastMethod<T>(this: Pattern<T>, n: number): Pattern<T> {
  return fast(n, this);
};

Pattern.prototype.slow = function slowMethod<T>(this: Pattern<T>, n: number): Pattern<T> {
  return slow(n, this);
};

Pattern.prototype.rev = function revMethod<T>(this: Pattern<T>): Pattern<T> {
  return rev(this);
};
