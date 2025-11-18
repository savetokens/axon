import { describe, test, expect } from 'vitest';
import {
  compressRLE,
  decompressRLE,
  shouldUseRLE,
  getRLECompressionRatio,
} from '../../src/compression/rle';

describe('RLE Compression', () => {
  describe('Basic Compression', () => {
    test('compresses repeated values', () => {
      const data = ['a', 'a', 'a', 'b', 'b', 'c'];
      const compressed = compressRLE(data);

      expect(compressed).toBe('a*3, b*2, c*1');
    });

    test('handles single value repeated', () => {
      const data = ['value', 'value', 'value', 'value', 'value'];
      const compressed = compressRLE(data);

      expect(compressed).toBe('value*5');
    });

    test('handles no repetition', () => {
      const data = ['a', 'b', 'c', 'd', 'e'];
      const compressed = compressRLE(data);

      expect(compressed).toBe('a*1, b*1, c*1, d*1, e*1');
    });

    test('handles empty array', () => {
      const data: string[] = [];
      const compressed = compressRLE(data);

      expect(compressed).toBe('');
    });
  });

  describe('Decompression', () => {
    test('decompresses to original array', () => {
      const compressed = 'a*3, b*2, c*1';
      const decompressed = decompressRLE(compressed);

      expect(decompressed).toEqual(['a', 'a', 'a', 'b', 'b', 'c']);
    });

    test('handles single run', () => {
      const compressed = 'value*10';
      const decompressed = decompressRLE(compressed);

      expect(decompressed).toHaveLength(10);
      expect(decompressed.every((v) => v === 'value')).toBe(true);
    });

    test('handles empty string', () => {
      expect(decompressRLE('')).toEqual([]);
    });

    test('throws on invalid format', () => {
      expect(() => decompressRLE('invalid')).toThrow();
      expect(() => decompressRLE('a*b')).toThrow();
    });
  });

  describe('Round-Trip', () => {
    test('preserves data through compress/decompress', () => {
      const original = ['active', 'active', 'active', 'inactive', 'inactive', 'pending'];
      const compressed = compressRLE(original);
      const decompressed = decompressRLE(compressed);

      expect(decompressed).toEqual(original);
    });

    test('works with boolean values', () => {
      const original = [true, true, true, false, false, true];
      const compressed = compressRLE(original);
      const decompressed = decompressRLE(compressed);

      expect(decompressed).toEqual(original);
    });

    test('works with numbers', () => {
      const original = [1, 1, 1, 2, 2, 3, 3, 3, 3];
      const compressed = compressRLE(original);
      const decompressed = decompressRLE(compressed);

      expect(decompressed).toEqual(original);
    });
  });

  describe('Compression Heuristics', () => {
    test('recommends RLE for highly repetitive data', () => {
      // 70% repetition
      const data = Array(70).fill('active').concat(Array(30).fill('inactive'));

      expect(shouldUseRLE(data)).toBe(true);
    });

    test('does not recommend RLE for diverse data', () => {
      const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      expect(shouldUseRLE(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = ['a', 'a', 'a'];

      expect(shouldUseRLE(data)).toBe(false);
    });
  });

  describe('Compression Ratio', () => {
    test('achieves high compression for repeated data', () => {
      const data = Array(1000).fill('status');
      const ratio = getRLECompressionRatio(data);

      // Should be very small ratio (high compression)
      expect(ratio).toBeLessThan(0.1);
    });

    test('shows poor compression for diverse data', () => {
      const data = Array.from({ length: 100 }, (_, i) => `value${i}`);
      const ratio = getRLECompressionRatio(data);

      // Ratio close to 1 (no benefit)
      expect(ratio).toBeGreaterThan(0.8);
    });
  });
});
