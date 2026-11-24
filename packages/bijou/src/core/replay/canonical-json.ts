import { ReplayOutboxError } from './replay-outbox-error.js';

/**
 * Serialize plain JSON data canonically (DL-033): object keys sorted by
 * Unicode code point, no insignificant whitespace, `-0` written as `0`, and
 * strings escaped as `JSON.stringify` escapes them.
 *
 * Validation and serialization are one pass. Anything that is not plain data
 * throws a `non-plain-value` {@link ReplayOutboxError} naming the path:
 * `undefined`, functions, symbols, bigints, `NaN` and infinities, class
 * instances (`Date`, `Map`, `Set`, typed arrays, ...), array holes, symbol
 * keys, accessor or non-enumerable properties, and cycles. A value that is
 * shared by two branches without a cycle is allowed.
 */
export function canonicalJson(value: unknown, path = '$'): string {
  return writeValue(value, path, []);
}

function writeValue(value: unknown, path: string, ancestors: object[]): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'object') return writeContainer(value, path, ancestors);
  if (typeof value !== 'number') throw nonPlain(path, `a value of type ${typeof value}`);
  if (!Number.isFinite(value)) throw nonPlain(path, 'a non-finite number');
  return Object.is(value, -0) ? '0' : JSON.stringify(value);
}

function writeContainer(value: object, path: string, ancestors: object[]): string {
  if (ancestors.includes(value)) throw nonPlain(path, 'a cycle');
  ancestors.push(value);
  const text = Array.isArray(value)
    ? writeArray(value, path, ancestors)
    : writeObject(value, path, ancestors);
  ancestors.pop();
  return text;
}

function writeArray(value: readonly unknown[], path: string, ancestors: object[]): string {
  if (Object.getPrototypeOf(value) !== Array.prototype) throw nonPlain(path, 'an array subclass');
  if (Reflect.ownKeys(value).length !== value.length + 1) {
    throw nonPlain(path, 'an array with holes or extra properties');
  }
  const items: string[] = [];
  for (let index = 0; index < value.length; index++) {
    items.push(writeValue(value[index], `${path}[${String(index)}]`, ancestors));
  }
  return `[${items.join(',')}]`;
}

function writeObject(value: object, path: string, ancestors: object[]): string {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw nonPlain(path, `an instance of ${Object.prototype.toString.call(value)}`);
  }
  const keys: string[] = [];
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') throw nonPlain(path, 'a symbol key');
    keys.push(key);
  }
  keys.sort(compareCodePoints);
  const members: string[] = [];
  for (const key of keys) {
    const memberPath = memberPathOf(path, key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw nonPlain(memberPath, 'an accessor or non-enumerable property');
    }
    const member: unknown = descriptor.value;
    members.push(`${JSON.stringify(key)}:${writeValue(member, memberPath, ancestors)}`);
  }
  return `{${members.join(',')}}`;
}

/** Order two strings by Unicode code point, not by UTF-16 code unit. */
export function compareCodePoints(left: string, right: string): number {
  let index = 0;
  while (index < left.length && index < right.length) {
    const leftPoint = left.codePointAt(index) ?? 0;
    const rightPoint = right.codePointAt(index) ?? 0;
    if (leftPoint !== rightPoint) return leftPoint - rightPoint;
    index += leftPoint > 0xffff ? 2 : 1;
  }
  return left.length - right.length;
}

function memberPathOf(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/u.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

function nonPlain(path: string, found: string): ReplayOutboxError {
  return new ReplayOutboxError('non-plain-value', path, `${found} is not plain JSON data`);
}
