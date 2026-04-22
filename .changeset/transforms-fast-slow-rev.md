---
"loom": minor
---

**transforms:** ship `fast`, `slow`, `rev` — the three lossless time transforms.

- **`fast(n, pattern)`** compresses the pattern into `1/n` of its duration (`fast(2, p)` plays `p` at double speed).
- **`slow(n, pattern)`** stretches the pattern to `n×` its duration — the semantic inverse of `fast`, implemented directly on rational `Time` so non-integer factors stay exact.
- **`rev(pattern)`** reverses event order within each cycle by reflecting around the cycle midpoint.

All three ship as standalone functions AND as methods on `Pattern.prototype` via TypeScript module augmentation — `pat.fast(2).rev()` works identically to `rev(fast(2, pat))`. Importing `loom/transforms` (or using the subpath export added in `package.json`) triggers the prototype augmentation.

`fast` and `slow` reject non-positive or non-finite factors with `RangeError`. `rev` takes no arguments.

Closes #13.
