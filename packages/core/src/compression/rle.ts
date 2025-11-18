/**
 * Run-Length Encoding (RLE) Compression
 * Compresses consecutive repeated values
 * Format: value*count, value*count, ...
 */

/**
 * Compress array using RLE
 */
export function compressRLE(data: any[]): string {
  if (data.length === 0) {
    return '';
  }

  const runs: Array<{ value: any; count: number }> = [];
  let currentValue = data[0];
  let currentCount = 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i] === currentValue) {
      currentCount++;
    } else {
      runs.push({ value: currentValue, count: currentCount });
      currentValue = data[i];
      currentCount = 1;
    }
  }

  // Push final run
  runs.push({ value: currentValue, count: currentCount });

  // Format as: value*count, value*count, ...
  return runs.map((run) => `${run.value}*${run.count}`).join(', ');
}

/**
 * Decompress RLE string to array
 */
export function decompressRLE(compressed: string): any[] {
  if (!compressed || compressed.trim().length === 0) {
    return [];
  }

  const result: any[] = [];
  const runs = compressed.split(',').map((s) => s.trim());

  for (const run of runs) {
    const parts = run.split('*');
    if (parts.length !== 2) {
      throw new Error(`Invalid RLE format: ${run}`);
    }

    const value = parseValue(parts[0]!);
    const count = parseInt(parts[1]!, 10);

    if (isNaN(count) || count < 1) {
      throw new Error(`Invalid count in RLE: ${parts[1]}`);
    }

    for (let i = 0; i < count; i++) {
      result.push(value);
    }
  }

  return result;
}

/**
 * Check if RLE compression is beneficial
 */
export function shouldUseRLE(data: any[]): boolean {
  if (data.length < 10) {
    return false; // Too small
  }

  // Count consecutive runs
  let runs = 0;
  let totalRun = 0;

  for (let i = 0; i < data.length; i++) {
    let runLength = 1;
    while (i + runLength < data.length && data[i] === data[i + runLength]) {
      runLength++;
    }

    if (runLength > 1) {
      runs++;
      totalRun += runLength;
    }

    i += runLength - 1;
  }

  // If >30% of data is in runs, RLE is beneficial
  return totalRun / data.length > 0.3;
}

/**
 * Calculate compression ratio
 */
export function getRLECompressionRatio(data: any[]): number {
  const original = data.join(',').length;
  const compressed = compressRLE(data).length;

  return compressed / original;
}

/**
 * Parse value from string (simple parser)
 */
function parseValue(str: string): any {
  const trimmed = str.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Null
  if (trimmed === 'null') return null;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed, 10);
  }

  // String
  return trimmed;
}
