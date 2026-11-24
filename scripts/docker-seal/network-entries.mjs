import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const IFF_UP = 1;

/**
 * List what the kernel shows under `/sys/class/net` in this network namespace.
 *
 * A device is a directory holding its attributes. Anything else is a control
 * file, such as the bonding driver's `bonding_masters`. A device is up when the
 * `IFF_UP` bit of its `flags` attribute is set; flags that cannot be read as a
 * non-negative integer count as up, so an unreadable device is never admitted
 * as idle.
 */
export function readNetworkEntries(root = '/sys/class/net') {
  return readdirSync(root).sort().map((name) => {
    const path = join(root, name);
    if (!statSync(path).isDirectory()) return { name, device: false, up: false };
    const text = readFileSync(join(path, 'flags'), 'utf8').trim();
    const flags = text === '' ? Number.NaN : Number(text);
    const readable = Number.isSafeInteger(flags) && flags >= 0;
    return { name, device: true, up: !readable || (flags & IFF_UP) === IFF_UP };
  });
}
