// Mini-notation parser.
//
// v0 (#12):   space-separated tokens + rests `~`
//               "c3 e3 ~ g3"  →  pattern of 4 steps
//
// v0.1 roadmap:
//   #26  subdivision groups `[x y]`          nested step packing
//   #27  alternation `<x y>`                 cycle-to-cycle variation
//   #28  modifiers `*n` `/n` `@n`            inline time scaling
//
// v1 roadmap:
//   #29  euclidean `x(k, n)`                 Bjorklund distribution
//
// Out of scope: polymetric `{x y}`, probability `x?p` — covered by
// combinators in `src/transforms/` instead.
export {};
