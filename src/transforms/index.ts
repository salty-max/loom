// Side-effect import: attaches `.fast`, `.slow`, `.rev` on
// `Pattern.prototype` so every Pattern instance picks up the methods.
import '@loom/transforms/augment.js';

export { fast } from '@loom/transforms/fast.js';
export { rev } from '@loom/transforms/rev.js';
export { slow } from '@loom/transforms/slow.js';
