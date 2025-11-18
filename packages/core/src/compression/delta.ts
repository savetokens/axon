/**
 * Delta Encoding
 * Stores differences between consecutive values
 * Format: base_value, +delta, +delta, -delta, ...
 */

/**
 * Compress array using delta encoding
 */
export function compressDelta(data: number[]): string {
  if (data.length === 0) {
    return '';
  }

  const result: string[] = [String(data[0])]; // Base value

  for (let i = 1; i < data.length; i++) {
    const delta = data[i]! - data[i - 1]!;
    const sign = delta >= 0 ? '+' : '';
    result.push(`${sign}${delta}`);
  }

  return result.join(', ');
}

/**
 * Decompress delta encoded data
 */
export function decompressDelta(compressed: string): number[] {
  if (!compressed || compressed.trim().length === 0) {
    return [];
  }

  const parts = compressed.split(',').map((s) => s.trim());
  const result: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      // Base value
      result.push(parseFloat(parts[0]!));
    } else {
      // Delta value
      const delta = parseFloat(parts[i]!);
      result.push(result[i - 1]! + delta);
    }
  }

  return result;
}

/**
 * Check if delta encoding is beneficial
 */
export function shouldUseDelta(data: number[]): boolean {
  if (data.length < 10) {
    return false; // Too small
  }

  // Calculate average delta magnitude
  let totalDelta = 0;
  for (let i = 1; i < data.length; i++) {
    totalDelta += Math.abs(data[i]! - data[i - 1]!);
  }

  const avgDelta = totalDelta / (data.length - 1);
  const avgValue = data.reduce((sum, val) => sum + Math.abs(val), 0) / data.length;

  // Delta is beneficial if deltas are <20% of average value
  return avgDelta < avgValue * 0.2;
}

/**
 * Calculate compression ratio
 */
export function getDeltaCompressionRatio(data: number[]): number {
  const original = data.join(',').length;
  const compressed = compressDelta(data).length;

  return compressed / original;
}

/**
 * Compress timestamp array (ISO-8601 strings) using delta in seconds
 */
export function compressTimestampDelta(timestamps: string[]): string {
  if (timestamps.length === 0) {
    return '';
  }

  const result: string[] = [timestamps[0]!]; // Base timestamp

  for (let i = 1; i < timestamps.length; i++) {
    const currentTime = new Date(timestamps[i]!).getTime();
    const deltaMs = currentTime - new Date(timestamps[i - 1]!).getTime();
    const deltaSeconds = Math.floor(deltaMs / 1000);

    const sign = deltaSeconds >= 0 ? '+' : '';
    result.push(`${sign}${deltaSeconds}`);
  }

  return result.join(', ');
}

/**
 * Decompress timestamp delta
 */
export function decompressTimestampDelta(compressed: string): string[] {
  if (!compressed || compressed.trim().length === 0) {
    return [];
  }

  const parts = compressed.split(',').map((s) => s.trim());
  const result: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      // Base timestamp
      result.push(parts[0]!);
    } else {
      // Delta in seconds
      const deltaSeconds = parseInt(parts[i]!, 10);
      const prevDate = new Date(result[i - 1]!);
      const newDate = new Date(prevDate.getTime() + deltaSeconds * 1000);
      result.push(newDate.toISOString());
    }
  }

  return result;
}
