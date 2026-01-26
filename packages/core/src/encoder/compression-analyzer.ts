/**
 * Compression Analyzer
 * Analyzes data fields to recommend optimal compression algorithms
 */

export type CompressionAlgorithm = 'rle' | 'dictionary' | 'delta' | 'bitpack' | 'none';

export interface CompressionRecommendation {
  field: string;
  algorithm: CompressionAlgorithm;
  ratio: number;
}

/**
 * Analyze data fields and recommend compression algorithms
 */
export function analyzeCompression(data: any[]): CompressionRecommendation[] {
  const recommendations: CompressionRecommendation[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return recommendations;
  }

  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return recommendations;
  }

  const fields = Object.keys(firstItem);

  for (const field of fields) {
    const values = data.map((item) => item[field]);
    const recommendation = recommendCompression(field, values);
    if (recommendation.algorithm !== 'none') {
      recommendations.push(recommendation);
    }
  }

  return recommendations;
}

/**
 * Recommend compression algorithm for a field
 */
function recommendCompression(field: string, values: any[]): CompressionRecommendation {
  // Check RLE first (runs of repeated values)
  const rleRatio = getRLECompressionRatio(values);
  if (rleRatio >= 0.3) {
    return { field, algorithm: 'rle', ratio: rleRatio };
  }

  // Check dictionary (low cardinality strings)
  if (shouldUseDictionary(values)) {
    const dictRatio = getDictionaryRatio(values);
    if (dictRatio >= 0.2) {
      return { field, algorithm: 'dictionary', ratio: dictRatio };
    }
  }

  // Check delta (sequential numbers)
  if (shouldUseDelta(values)) {
    const deltaRatio = getDeltaRatio(values);
    if (deltaRatio >= 0.2) {
      return { field, algorithm: 'delta', ratio: deltaRatio };
    }
  }

  // Check bitpacking (small integers)
  if (shouldUseBitPacking(values)) {
    const bitpackRatio = getBitPackingRatio(values);
    if (bitpackRatio >= 0.2) {
      return { field, algorithm: 'bitpack', ratio: bitpackRatio };
    }
  }

  return { field, algorithm: 'none', ratio: 0 };
}

/**
 * Calculate RLE compression ratio
 * RLE is effective when there are long runs of repeated values
 */
export function getRLECompressionRatio(values: any[]): number {
  if (values.length === 0) return 0;

  let runs = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1]) {
      runs++;
    }
  }

  // Ratio of compression: 1 - (runs / total)
  // More runs = less compression
  return 1 - runs / values.length;
}

/**
 * Check if dictionary compression should be used
 * Best for low cardinality string fields
 */
export function shouldUseDictionary(values: any[]): boolean {
  if (values.length < 10) return false;

  // Only for strings
  if (!values.every((v) => typeof v === 'string' || v === null)) {
    return false;
  }

  const uniqueValues = new Set(values);
  const cardinality = uniqueValues.size / values.length;

  // Low cardinality (< 20% unique values)
  return cardinality < 0.2;
}

/**
 * Calculate dictionary compression ratio
 */
export function getDictionaryRatio(values: any[]): number {
  if (values.length === 0) return 0;

  const uniqueValues = new Set(values);
  const dictSize = Array.from(uniqueValues).join('').length;
  const originalSize = values.join('').length;

  if (originalSize === 0) return 0;

  // Estimate: dict size + indices vs original
  const compressedSize = dictSize + values.length * 2; // 2 bytes per index estimate
  return 1 - compressedSize / originalSize;
}

/**
 * Check if delta compression should be used
 * Best for sequential or monotonic numeric data
 */
export function shouldUseDelta(values: any[]): boolean {
  if (values.length < 10) return false;

  // Must be all numbers
  if (!values.every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return false;
  }

  // Check if monotonic (ascending or descending)
  let ascending = 0;
  let descending = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) ascending++;
    if (values[i] < values[i - 1]) descending++;
  }

  const total = values.length - 1;
  return ascending / total > 0.8 || descending / total > 0.8;
}

/**
 * Calculate delta compression ratio
 */
export function getDeltaRatio(values: any[]): number {
  if (values.length < 2) return 0;

  // Calculate deltas
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) {
    deltas.push(values[i] - values[i - 1]);
  }

  // Estimate storage: original numbers vs base + deltas
  const originalDigits = values.reduce((sum, v) => sum + String(v).length, 0);
  const deltaDigits =
    String(values[0]).length + deltas.reduce((sum, d) => sum + String(d).length + 1, 0); // +1 for +/- sign

  if (originalDigits === 0) return 0;
  return 1 - deltaDigits / originalDigits;
}

/**
 * Check if bit packing should be used
 * Best for small integers that fit in fewer bits
 */
export function shouldUseBitPacking(values: any[]): boolean {
  if (values.length < 10) return false;

  // Must be all integers
  if (!values.every((v) => typeof v === 'number' && Number.isInteger(v))) {
    return false;
  }

  // Check range
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Only if range fits in 16 bits or less
  return min >= 0 && max <= 65535;
}

/**
 * Calculate bit packing ratio
 */
export function getBitPackingRatio(values: any[]): number {
  if (values.length === 0) return 0;

  const max = Math.max(...values.filter((v) => typeof v === 'number'));
  const bitsNeeded = Math.ceil(Math.log2(max + 1));

  // Compare to 32-bit storage
  const originalBits = values.length * 32;
  const packedBits = values.length * bitsNeeded;

  return 1 - packedBits / originalBits;
}

/**
 * Encode values with RLE
 */
export function encodeRLE(values: any[]): string {
  if (values.length === 0) return '';

  const runs: Array<{ value: any; count: number }> = [];
  let currentValue = values[0];
  let count = 1;

  for (let i = 1; i < values.length; i++) {
    if (values[i] === currentValue) {
      count++;
    } else {
      runs.push({ value: currentValue, count });
      currentValue = values[i];
      count = 1;
    }
  }
  runs.push({ value: currentValue, count });

  // Format: value*count|value*count|...
  return runs.map((r) => (r.count > 1 ? `${r.value}*${r.count}` : String(r.value))).join('|');
}

/**
 * Encode values with delta compression
 */
export function encodeDelta(values: number[]): string {
  if (values.length === 0) return '';

  const parts: string[] = [String(values[0])];
  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    parts.push(delta >= 0 ? `+${delta}` : String(delta));
  }

  return parts.join('|');
}

/**
 * Build dictionary and encode values
 */
export function encodeDictionary(values: string[]): { dict: string[]; indices: number[] } {
  const dict: string[] = [];
  const valueToIndex = new Map<string, number>();
  const indices: number[] = [];

  for (const value of values) {
    let index = valueToIndex.get(value);
    if (index === undefined) {
      index = dict.length;
      dict.push(value);
      valueToIndex.set(value, index);
    }
    indices.push(index);
  }

  return { dict, indices };
}
