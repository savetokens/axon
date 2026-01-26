import type { EncodeOptions, TokenStats } from '../types';
import { serialize } from './serializer';

/**
 * Estimate token count for a string
 * Uses a simple heuristic: split on whitespace and punctuation
 */
function estimateTokens(str: string): number {
  // Split on whitespace and common punctuation
  const tokens = str.split(/[\s\[\]\{\}\(\):,|"]+/).filter((t) => t.length > 0);
  // Add back punctuation count (each punct is roughly a token)
  const punctCount = (str.match(/[\[\]\{\}\(\):,|"]/g) || []).length;
  return tokens.length + Math.ceil(punctCount * 0.5);
}

/**
 * Calculate token statistics comparing AXON to JSON
 */
function calculateStats(original: any, encoded: string): TokenStats {
  const jsonPretty = JSON.stringify(original, null, 2);
  const jsonCompact = JSON.stringify(original);

  const axonTokens = estimateTokens(encoded);
  const jsonTokens = estimateTokens(jsonPretty);
  const jsonCompactTokens = estimateTokens(jsonCompact);

  return {
    axon_tokens: axonTokens,
    json_tokens: jsonTokens,
    json_compact_tokens: jsonCompactTokens,
    reduction_vs_json: jsonTokens > 0 ? 1 - axonTokens / jsonTokens : 0,
    reduction_vs_json_compact: jsonCompactTokens > 0 ? 1 - axonTokens / jsonCompactTokens : 0,
  };
}

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
  const result = serialize(value, options);

  if (options?.stats) {
    const stats = calculateStats(value, result);
    // Output stats as a comment at the end of the AXON
    const statsComment = [
      '',
      `# Token Statistics:`,
      `#   AXON tokens: ${stats.axon_tokens}`,
      `#   JSON (pretty) tokens: ${stats.json_tokens}`,
      `#   JSON (compact) tokens: ${stats.json_compact_tokens}`,
      `#   Reduction vs JSON: ${(stats.reduction_vs_json * 100).toFixed(1)}%`,
      `#   Reduction vs JSON compact: ${(stats.reduction_vs_json_compact * 100).toFixed(1)}%`,
    ].join('\n');
    return result + statsComment;
  }

  return result;
}
