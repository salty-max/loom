---
"loom": minor
---

**pico8:** cap `pico8Validate(pattern, cycles)` at `MAX_VALIDATE_CYCLES` (10 000) and unify input-validation errors.

- New exported constant `MAX_VALIDATE_CYCLES` so callers can check the boundary.
- `cycles` outside `[1, MAX_VALIDATE_CYCLES]` (non-integer, non-positive, or above the cap) now throws `Pico8Error('PICO8_INVALID_CYCLES')` with a structured payload `{ cycles, max? }`.
- Previously the non-positive / non-integer path threw a plain `TypeError` — migrating to `Pico8Error` keeps the whole cycles-input validation inside the stable PICO-8 error hierarchy (a small behaviour change, but the library is pre-MVP). Catch sites that keyed on `TypeError` should switch to `Pico8Error` / `.code === 'PICO8_INVALID_CYCLES'`.

Closes #46.
