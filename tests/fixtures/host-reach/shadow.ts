// A local binding named like a host global is not a use of it.
export function shadowed(process: number): number {
  return process + 1;
}
