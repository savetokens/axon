import type { EncodeOptions } from '../types';
import { serialize } from './serializer';

/**
 * Encode JavaScript object to AXON string
 *
 * @param value - JavaScript value to encode
 * @param options - Encoding options
 * @returns AXON-formatted string
 *
 * @example
 * ```typescript
 * const data = {
 *   users: [
 *     { id: 1, name: 'Alice', role: 'admin' },
 *     { id: 2, name: 'Bob', role: 'user' }
 *   ]
 * };
 *
 * const axon = encode(data);
 * // Output:
 * // users::[2] id:i32|name:str|role:str
 * //   1|Alice|admin
 * //   2|Bob|user
 * ```
 */
export function encode(value: any, options?: EncodeOptions): string {
  return serialize(value, options);
}
