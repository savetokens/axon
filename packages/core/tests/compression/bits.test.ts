import { describe, test, expect } from 'vitest';
import {
  compressToBinary,
  decompressFromBinary,
  compressToHex,
  decompressFromHex,
  shouldUseBitPacking,
  getBitPackingRatio,
} from '../../src/compression/bits';

describe('Bit Packing Compression', () => {
  describe('Binary Compression', () => {
    test('compresses boolean array to binary string', () => {
      const data = [true, false, true, true, false];
      const binary = compressToBinary(data);

      expect(binary).toBe('10110');
    });

    test('handles all true', () => {
      const data = [true, true, true, true];
      const binary = compressToBinary(data);

      expect(binary).toBe('1111');
    });

    test('handles all false', () => {
      const data = [false, false, false];
      const binary = compressToBinary(data);

      expect(binary).toBe('000');
    });
  });

  describe('Binary Decompression', () => {
    test('reconstructs boolean array', () => {
      const binary = '10110';
      const decompressed = decompressFromBinary(binary);

      expect(decompressed).toEqual([true, false, true, true, false]);
    });

    test('throws on invalid binary', () => {
      expect(() => decompressFromBinary('102')).toThrow();
      expect(() => decompressFromBinary('abc')).toThrow();
    });
  });

  describe('Hex Compression', () => {
    test('compresses to hex string', () => {
      const data = [true, false, true, true, false, false, true, true];
      const hex = compressToHex(data);

      // 1011 0011 = B3
      expect(hex).toBe('B3');
    });

    test('handles padding', () => {
      const data = [true, false, true]; // 3 bits, needs padding to 4
      const hex = compressToHex(data);

      // 1010 (padded) = A
      expect(hex).toBe('A');
    });

    test('handles longer arrays', () => {
      const data = Array(16).fill(true);
      const hex = compressToHex(data);

      // 1111 1111 1111 1111 = FFFF
      expect(hex).toBe('FFFF');
    });
  });

  describe('Hex Decompression', () => {
    test('reconstructs from hex', () => {
      const hex = 'B3';
      const decompressed = decompressFromHex(hex, 8);

      expect(decompressed).toEqual([true, false, true, true, false, false, true, true]);
    });

    test('handles multiple bytes', () => {
      const hex = 'FFFF';
      const decompressed = decompressFromHex(hex, 16);

      expect(decompressed).toHaveLength(16);
      expect(decompressed.every((v) => v === true)).toBe(true);
    });

    test('throws on invalid hex', () => {
      expect(() => decompressFromHex('XYZ')).toThrow();
    });
  });

  describe('Round-Trip', () => {
    test('binary round-trip preserves data', () => {
      const original = [true, false, true, false, true, true, false];
      const binary = compressToBinary(original);
      const decompressed = decompressFromBinary(binary);

      expect(decompressed).toEqual(original);
    });

    test('hex round-trip preserves data', () => {
      const original = Array.from({ length: 32 }, (_, i) => i % 2 === 0);
      const hex = compressToHex(original);
      const decompressed = decompressFromHex(hex, 32);

      expect(decompressed).toEqual(original);
    });
  });

  describe('Compression Heuristics', () => {
    test('recommends bit packing for boolean arrays >= 20', () => {
      const data = Array(50).fill(true);

      expect(shouldUseBitPacking(data)).toBe(true);
    });

    test('does not recommend for small boolean arrays', () => {
      const data = [true, false, true];

      expect(shouldUseBitPacking(data)).toBe(false);
    });

    test('does not recommend for non-boolean arrays', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(shouldUseBitPacking(data)).toBe(false);
    });
  });

  describe('Compression Ratio', () => {
    test('achieves high compression for large boolean arrays', () => {
      const data = Array(1000).fill(true);
      const ratio = getBitPackingRatio(data, false);

      // Binary: 1000 chars vs "true, true, ..." = ~5000 chars
      expect(ratio).toBeLessThan(0.3);
    });

    test('hex is more efficient than binary', () => {
      const data = Array(1000).fill(true);
      const binaryRatio = getBitPackingRatio(data, false);
      const hexRatio = getBitPackingRatio(data, true);

      expect(hexRatio).toBeLessThan(binaryRatio);
    });
  });
});
