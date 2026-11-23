// A parameter shadows a host global only inside its own function.
export function local(process: number): number {
  return process + 1;
}
export const resident = (): number => process.memoryUsage().rss;

// A parameter named like a global object is not that object.
export function ownSelf(self: { readonly Buffer: number }): number {
  return self.Buffer;
}
