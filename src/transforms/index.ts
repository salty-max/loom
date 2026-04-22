// Pattern transformations.
//
// v0 is intentionally minimal to match the PICO-8 scope. The core pattern
// algebra supports arbitrary transforms; we gate them at the public API
// to avoid blowing past PICO-8 semantics before v0 ships.
//
// Planned for v0: fast, slow, rev (time-only, lossless on a 32-step grid).
// Deferred to v0.1+: every, jux, struct, chunk, and other Tidal combinators.
export {};
