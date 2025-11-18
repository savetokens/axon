/**
 * Bit Packing Compression
 * Packs boolean arrays into binary or hex strings
 * Formats: @bits (binary), @bits-hex (hexadecimal)
 */

/**
 * Compress boolean array to binary string
 */
export function compressToBinary(data: boolean[]): string {
  return data.map((b) => (b ? '1' : '0')).join('');
}

/**
 * Decompress binary string to boolean array
 */
export function decompressFromBinary(binary: string): boolean[] {
  return binary.split('').map((bit) => {
    if (bit !== '0' && bit !== '1') {
      throw new Error(`Invalid bit: ${bit}`);
    }
    return bit === '1';
  });
}

/**
 * Compress boolean array to hex string
 */
export function compressToHex(data: boolean[]): string {
  const binary = compressToBinary(data);

  // Pad to multiple of 4
  const padded = binary.padEnd(Math.ceil(binary.length / 4) * 4, '0');

  // Convert to hex
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) {
    const nibble = padded.substring(i, i + 4);
    const value = parseInt(nibble, 2);
    hex += value.toString(16).toUpperCase();
  }

  return hex;
}

/**
 * Decompress hex string to boolean array
 */
export function decompressFromHex(hex: string, length?: number): boolean[] {
  // Convert hex to binary
  let binary = '';
  for (const char of hex) {
    const value = parseInt(char, 16);
    if (isNaN(value)) {
      throw new Error(`Invalid hex character: ${char}`);
    }
    binary += value.toString(2).padStart(4, '0');
  }

  // Trim to original length if provided
  if (length !== undefined && length < binary.length) {
    binary = binary.substring(0, length);
  }

  return decompressFromBinary(binary);
}

/**
 * Check if bit packing is beneficial
 */
export function shouldUseBitPacking(data: any[]): boolean {
  // Only for boolean arrays
  if (!data.every((v) => typeof v === 'boolean')) {
    return false;
  }

  // Beneficial for arrays of 20+ booleans
  return data.length >= 20;
}

/**
 * Calculate compression ratio for bit packing
 */
export function getBitPackingRatio(data: boolean[], useHex: boolean = false): number {
  // Original: "true, false, true" format
  const original = data.map((b) => (b ? 'true' : 'false')).join(', ').length;

  // Compressed
  const compressed = useHex ? compressToHex(data).length : compressToBinary(data).length;

  return compressed / original;
}
