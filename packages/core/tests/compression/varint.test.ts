import { describe, test, expect } from 'vitest';
import {
  encodeVarint,
  decodeVarint,
  getVarintLength,
  shouldUseVarint,
  getVarintSavings,
} from '../../src/compression/varint';

describe('Varint Encoding', () => {
  describe('Encoding', () => {
    test('encodes small values in 1 byte', () => {
      expect(encodeVarint(0)).toEqual([0]);
      expect(encodeVarint(1)).toEqual([1]);
      expect(encodeVarint(127)).toEqual([127]);
    });

    test('encodes medium values in 2 bytes', () => {
      expect(encodeVarint(128)).toHaveLength(2);
      expect(encodeVarint(300)).toHaveLength(2);
      expect(encodeVarint(16383)).toHaveLength(2);
    });

    test('encodes larger values in 3+ bytes', () => {
      expect(encodeVarint(16384)).toHaveLength(3);
      expect(encodeVarint(1000000)).toHaveLength(3);
    });

    test('throws on negative numbers', () => {
      expect(() => encodeVarint(-1)).toThrow();
      expect(() => encodeVarint(-100)).toThrow();
    });

    test('throws on non-integers', () => {
      expect(() => encodeVarint(3.14)).toThrow();
    });
  });

  describe('Decoding', () => {
    test('decodes small values', () => {
      expect(decodeVarint([0])).toBe(0);
      expect(decodeVarint([1])).toBe(1);
      expect(decodeVarint([127])).toBe(127);
    });

    test('decodes multi-byte values', () => {
      expect(decodeVarint([0x80, 0x01])).toBe(128);
      expect(decodeVarint([0xac, 0x02])).toBe(300);
    });
  });

  describe('Round-Trip', () => {
    test('preserves values through encode/decode', () => {
      const testValues = [0, 1, 127, 128, 255, 256, 16383, 16384, 1000000];

      testValues.forEach((value) => {
        const encoded = encodeVarint(value);
        const decoded = decodeVarint(encoded);
        expect(decoded).toBe(value);
      });
    });
  });

  describe('Varint Length', () => {
    test('calculates correct byte lengths', () => {
      expect(getVarintLength(0)).toBe(1);
      expect(getVarintLength(127)).toBe(1);
      expect(getVarintLength(128)).toBe(2);
      expect(getVarintLength(16383)).toBe(2);
      expect(getVarintLength(16384)).toBe(3);
      expect(getVarintLength(1000000)).toBe(3);
    });
  });

  describe('Compression Heuristics', () => {
    test('recommends varint for small values', () => {
      const data = Array.from({ length: 100 }, (_, i) => i); // 0-99

      expect(shouldUseVarint(data)).toBe(true);
    });

    test('does not recommend for large values', () => {
      const data = Array.from({ length: 100 }, (_, i) => i * 100000);

      expect(shouldUseVarint(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = [1, 2, 3];

      expect(shouldUseVarint(data)).toBe(false);
    });
  });

  describe('Space Savings', () => {
    test('calculates savings for small values', () => {
      const data = Array.from({ length: 100 }, (_, i) => i); // Mostly 1-byte
      const savings = getVarintSavings(data);

      // Should save ~75% (1 byte vs 4 bytes)
      expect(savings).toBeGreaterThan(0.6);
    });

    test('shows minimal savings for large values', () => {
      const data = Array(100).fill(1000000000);
      const savings = getVarintSavings(data);

      // Large numbers need 4-5 bytes anyway
      expect(savings).toBeLessThan(0.2);
    });
  });

  describe('Real-World Scenarios', () => {
    test('compresses view counts efficiently', () => {
      // Typical web analytics: mostly small numbers
      const views = [150, 230, 89, 456, 123, 67, 890, 234];

      views.forEach((count) => {
        const encoded = encodeVarint(count);
        expect(encoded.length).toBeLessThanOrEqual(2); // Most fit in 1-2 bytes
        const decoded = decodeVarint(encoded);
        expect(decoded).toBe(count);
      });
    });

    test('handles stock quantities', () => {
      const stock = [0, 15, 150, 1250, 89, 500, 23, 8, 345];

      const encoded = stock.map((s) => encodeVarint(s));
      const decoded = encoded.map((e) => decodeVarint(e));

      expect(decoded).toEqual(stock);
    });
  });
});
