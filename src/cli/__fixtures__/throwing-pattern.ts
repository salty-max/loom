import { Pattern } from '@loom/core/pattern.js';

// Default export is a Pattern whose query throws — exercises the
// CLI's render-time error path.
export default new Pattern(() => {
  throw new Error('boom');
});
