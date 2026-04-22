// Loom public API.
//
// Layering: core → pico8 → adapters → cli/runtime. Consumers typically
// import from the PICO-8 subpath (`loom/pico8`) for the constrained v0
// surface, and from the root for pattern-algebra primitives.

export * from '@loom/core/index.js';
