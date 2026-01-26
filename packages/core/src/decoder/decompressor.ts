/**
 * Decompressor utilities for decoding compressed AXON data
 */

/**
 * Decompress RLE-encoded data
 * Format: value*count|value*count|value
 * Example: "active*800|inactive*150|pending*50"
 */
export function decompressRLE(encoded: string): any[] {
  const result: any[] = [];
  const parts = encoded.split('|');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const asteriskIdx = trimmed.lastIndexOf('*');
    if (asteriskIdx > 0) {
      // Has count
      const value = trimmed.substring(0, asteriskIdx);
      const count = parseInt(trimmed.substring(asteriskIdx + 1), 10);
      for (let i = 0; i < count; i++) {
        result.push(parseValue(value));
      }
    } else {
      // Single value
      result.push(parseValue(trimmed));
    }
  }

  return result;
}

/**
 * Decompress delta-encoded data
 * Format: base|+delta|+delta|-delta
 * Example: "1001|+1|+1|+2|+1"
 */
export function decompressDelta(encoded: string): number[] {
  const result: number[] = [];
  const parts = encoded.split('|');

  if (parts.length === 0) return result;

  // First value is the base
  let current = parseFloat(parts[0]!.trim());
  result.push(current);

  // Remaining values are deltas
  for (let i = 1; i < parts.length; i++) {
    const delta = parseFloat(parts[i]!.trim());
    current += delta;
    result.push(current);
  }

  return result;
}

/**
 * Decompress dictionary-encoded data
 * @param dict - The dictionary array
 * @param indices - Array of indices into the dictionary
 */
export function decompressDictionary(dict: string[], indices: number[]): string[] {
  return indices.map((idx) => dict[idx] ?? '');
}

/**
 * Parse dictionary from string format
 * Format: [val1, val2, val3]
 */
export function parseDictionary(encoded: string): string[] {
  // Remove brackets and split
  let content = encoded.trim();
  if (content.startsWith('[')) content = content.substring(1);
  if (content.endsWith(']')) content = content.substring(0, content.length - 1);

  return content.split(',').map((s) => s.trim());
}

/**
 * Parse indices from string format
 * Format: 0,1,0,2,1
 */
export function parseIndices(encoded: string): number[] {
  return encoded
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

/**
 * Parse a string value into its appropriate type
 */
function parseValue(str: string): any {
  const trimmed = str.trim();

  // Remove quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Null
  if (trimmed === 'null') return null;

  // Number
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed, 10);
  }

  // String
  return trimmed;
}

/**
 * Compression directive types
 */
export type CompressionDirective = {
  type: 'rle' | 'dict' | 'delta' | 'idx';
  field: string;
  data: string;
};

/**
 * Parse compression directive from line
 * Format: @rle:field data
 */
export function parseCompressionDirective(line: string): CompressionDirective | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('@')) return null;

  // Match @type:field data
  const match = trimmed.match(/^@(\w+):(\w+)\s+(.+)$/);
  if (!match) return null;

  const [, type, field, data] = match;
  if (!type || !field || !data) return null;

  if (type === 'rle' || type === 'dict' || type === 'delta' || type === 'idx') {
    return { type, field, data };
  }

  return null;
}
