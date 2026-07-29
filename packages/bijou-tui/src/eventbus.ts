/**
 * Central typed event stream for TUI applications.
 *
 * The compatibility facade keeps the established import path while the
 * contracts, command lifecycle, I/O wiring, and pulse scheduler remain
 * independently inspectable.
 */

export { createEventBus } from './eventbus-create.js';
export type {
  BusMsg,
  EventBus,
  Middleware,
} from './eventbus-contract.js';
export type {
  CommandBackpressureInfo,
  CommandQueueDiagnostics,
  CreateEventBusOptions,
} from './eventbus-options.js';
