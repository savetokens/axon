/**
 * Dictionary Compression
 * Replaces repeated strings with indices
 * Format: @d: [value1, value2, ...], index, index, index, ...
 */

/**
 * Compress array using dictionary
 */
export function compressDictionary(data: any[]): { dictionary: any[]; indices: number[] } {
  const dictionary: any[] = [];
  const valueToIndex = new Map<any, number>();
  const indices: number[] = [];

  for (const value of data) {
    if (!valueToIndex.has(value)) {
      const index = dictionary.length;
      dictionary.push(value);
      valueToIndex.set(value, index);
    }

    indices.push(valueToIndex.get(value)!);
  }

  return { dictionary, indices };
}

/**
 * Decompress dictionary to original array
 */
export function decompressDictionary(dictionary: any[], indices: number[]): any[] {
  return indices.map((index) => {
    if (index < 0 || index >= dictionary.length) {
      throw new Error(`Dictionary index out of range: ${index}`);
    }
    return dictionary[index];
  });
}

/**
 * Check if dictionary compression is beneficial
 */
export function shouldUseDictionary(data: any[]): boolean {
  if (data.length < 20) {
    return false; // Too small
  }

  const uniqueCount = new Set(data).size;
  const compressionRatio = uniqueCount / data.length;

  // If <30% unique values, dictionary is beneficial
  return compressionRatio < 0.3;
}

/**
 * Calculate compression ratio
 */
export function getDictionaryCompressionRatio(data: any[]): number {
  const { dictionary, indices } = compressDictionary(data);

  // Estimate sizes
  const originalSize = data.join(',').length;
  const dictionarySize = dictionary.join(',').length;
  const indicesSize = indices.join(',').length;

  return (dictionarySize + indicesSize) / originalSize;
}

/**
 * Build optimal dictionary from data
 */
export function buildDictionary(data: any[]): any[] {
  // Count frequency of each value
  const frequency = new Map<any, number>();

  for (const value of data) {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  }

  // Sort by frequency (most frequent first)
  const sorted = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]);

  return sorted.map(([value]) => value);
}
