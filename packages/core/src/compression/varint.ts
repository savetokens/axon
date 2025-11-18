/**
 * Variable-Length Integer Encoding (Varint)
 * Encodes integers using fewer bytes for smaller values
 *
 * Encoding:
 * - 0-127: 1 byte
 * - 128-16,383: 2 bytes
 * - 16,384-2,097,151: 3 bytes
 * - Larger: 4-5 bytes
 */

/**
 * Encode integer as varint (returns byte array for demonstration)
 */
export function encodeVarint(value: number): number[] {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Varint requires non-negative integer, got: ${value}`);
  }

  const bytes: number[] = [];
  let remaining = value;

  while (remaining > 127) {
    // Set continuation bit (bit 7)
    bytes.push((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }

  // Last byte (no continuation bit)
  bytes.push(remaining & 0x7f);

  return bytes;
}

/**
 * Decode varint from byte array
 */
export function decodeVarint(bytes: number[]): number {
  let result = 0;
  let shift = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;

    // Extract 7 bits
    result |= (byte & 0x7f) << shift;

    // Check continuation bit
    if ((byte & 0x80) === 0) {
      return result;
    }

    shift += 7;
  }

  throw new Error('Invalid varint: missing terminator');
}

/**
 * Get varint byte length for a value
 */
export function getVarintLength(value: number): number {
  if (value < 0) return 5; // Negative numbers need full encoding
  if (value < 128) return 1;
  if (value < 16384) return 2;
  if (value < 2097152) return 3;
  if (value < 268435456) return 4;
  return 5;
}

/**
 * Check if varint encoding is beneficial
 */
export function shouldUseVarint(data: number[]): boolean {
  if (data.length < 10) {
    return false;
  }

  // Calculate average value
  const avg = data.reduce((sum, val) => sum + Math.abs(val), 0) / data.length;

  // Varint is beneficial if average value < 10,000 (fits in 2-3 bytes)
  return avg < 10000;
}

/**
 * Calculate space savings with varint
 */
export function getVarintSavings(data: number[]): number {
  // Fixed i32: 4 bytes each
  const fixedSize = data.length * 4;

  // Varint: sum of individual lengths
  const varintSize = data.reduce((sum, val) => sum + getVarintLength(Math.abs(val)), 0);

  return 1 - varintSize / fixedSize;
}
