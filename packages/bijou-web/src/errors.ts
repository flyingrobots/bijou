/** A Bijou port capability that a browser host cannot provide. */
export type WebUnsupportedCapability =
  | 'FilePort.readFile'
  | 'FilePort.readDir'
  | 'QueryPort.question'
  | 'InteractivePort.rawInput';

/** Stable code carried by every {@link WebUnsupportedCapabilityError}. */
export const WEB_UNSUPPORTED_CAPABILITY = 'BIJOU_WEB_UNSUPPORTED_CAPABILITY';

/**
 * Thrown when a caller asks the browser host for a capability it does not have.
 *
 * The browser adapters refuse loudly instead of returning empty values, so a
 * missing capability cannot pass for an empty file or an empty answer.
 */
export class WebUnsupportedCapabilityError extends Error {
  /** Stable machine-readable code. */
  readonly code = WEB_UNSUPPORTED_CAPABILITY;
  /** The port capability that was requested. */
  readonly capability: WebUnsupportedCapability;

  constructor(capability: WebUnsupportedCapability, guidance: string) {
    super(`${capability} is not supported in a browser host. ${guidance}`);
    this.name = 'WebUnsupportedCapabilityError';
    this.capability = capability;
  }
}
