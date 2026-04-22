import { pure, seq } from '@loom/core/primitives.js';

// Default export: a two-slot pattern `a` then `b` per cycle.
export default seq(pure('a'), pure('b'));
