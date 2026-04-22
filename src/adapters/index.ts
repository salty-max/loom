// Output adapters — each renders a pattern to a specific output.
//
// Roadmap:
// - print (#14): stdout JSON events (for tests and CLI debug)
// - web-audio (#15): browser playback with the 8-bit chiptune synth
// - midi (#16): Web MIDI (browser) and node-midi (Node)

export { DEFAULT_BPM, print, type PrintedEvent, type PrintOptions } from '@loom/adapters/print.js';
