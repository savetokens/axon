import type { DecodeOptions } from '../types';
import { tokenize } from './lexer';
import { parse } from './parser';
import { buildObject } from './builder';

/**
 * Decode AXON string to JavaScript object
 *
 * @param input - AXON-formatted string
 * @param options - Decoding options
 * @returns JavaScript object
 *
 * @example
 * ```typescript
 * const axon = 'users::[2] id|name\n  1|Alice\n  2|Bob';
 * const data = decode(axon);
 * // { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }
 * ```
 */
export function decode(input: string, _options?: DecodeOptions): any {
  // Step 1: Tokenize
  const tokens = tokenize(input);

  // Step 2: Parse to AST
  const ast = parse(tokens);

  // Step 3: Build JavaScript object
  const obj = buildObject(ast);

  return obj;
}
