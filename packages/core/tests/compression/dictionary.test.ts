import { describe, test, expect } from 'vitest';
import {
  compressDictionary,
  decompressDictionary,
  shouldUseDictionary,
  buildDictionary,
} from '../../src/compression/dictionary';

describe('Dictionary Compression', () => {
  describe('Basic Compression', () => {
    test('creates dictionary and indices', () => {
      const data = ['Berlin', 'Munich', 'Berlin', 'Hamburg', 'Berlin'];
      const { dictionary, indices } = compressDictionary(data);

      expect(dictionary).toEqual(['Berlin', 'Munich', 'Hamburg']);
      expect(indices).toEqual([0, 1, 0, 2, 0]);
    });

    test('handles all unique values', () => {
      const data = ['a', 'b', 'c', 'd'];
      const { dictionary, indices } = compressDictionary(data);

      expect(dictionary).toHaveLength(4);
      expect(indices).toEqual([0, 1, 2, 3]);
    });

    test('handles all same value', () => {
      const data = ['same', 'same', 'same', 'same'];
      const { dictionary, indices } = compressDictionary(data);

      expect(dictionary).toEqual(['same']);
      expect(indices).toEqual([0, 0, 0, 0]);
    });
  });

  describe('Decompression', () => {
    test('reconstructs original array', () => {
      const dictionary = ['Berlin', 'Munich', 'Hamburg'];
      const indices = [0, 1, 0, 2, 0, 1];

      const decompressed = decompressDictionary(dictionary, indices);

      expect(decompressed).toEqual(['Berlin', 'Munich', 'Berlin', 'Hamburg', 'Berlin', 'Munich']);
    });

    test('throws on invalid index', () => {
      const dictionary = ['a', 'b'];
      const indices = [0, 1, 5]; // Index 5 out of range

      expect(() => decompressDictionary(dictionary, indices)).toThrow();
    });
  });

  describe('Round-Trip', () => {
    test('preserves data through compress/decompress', () => {
      const original = ['Berlin', 'Munich', 'Berlin', 'Hamburg', 'Frankfurt', 'Berlin', 'Munich'];
      const { dictionary, indices } = compressDictionary(original);
      const decompressed = decompressDictionary(dictionary, indices);

      expect(decompressed).toEqual(original);
    });

    test('works with numbers', () => {
      const original = [100, 200, 100, 300, 100, 200];
      const { dictionary, indices } = compressDictionary(original);
      const decompressed = decompressDictionary(dictionary, indices);

      expect(decompressed).toEqual(original);
    });
  });

  describe('Compression Heuristics', () => {
    test('recommends dictionary for high-cardinality repetitive data', () => {
      // 50 cities, 500 entries (avg 10 repetitions each)
      const cities = Array.from({ length: 50 }, (_, i) => `City${i}`);
      const data = Array.from({ length: 500 }, (_, i) => cities[i % 50]!);

      expect(shouldUseDictionary(data)).toBe(true);
    });

    test('does not recommend for mostly unique data', () => {
      const data = Array.from({ length: 100 }, (_, i) => `unique${i}`);

      expect(shouldUseDictionary(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = ['a', 'a', 'b', 'b'];

      expect(shouldUseDictionary(data)).toBe(false);
    });
  });

  describe('Dictionary Building', () => {
    test('builds dictionary sorted by frequency', () => {
      const data = ['c', 'a', 'b', 'a', 'c', 'a', 'c', 'c', 'c'];
      // Frequency: c=5, a=3, b=1

      const dictionary = buildDictionary(data);

      expect(dictionary[0]).toBe('c'); // Most frequent first
      expect(dictionary[1]).toBe('a');
      expect(dictionary[2]).toBe('b');
    });
  });

  describe('Real-World Scenarios', () => {
    test('compresses city names efficiently', () => {
      const data = Array(100)
        .fill(null)
        .map((_, i) => ['Berlin', 'Munich', 'Hamburg'][i % 3]!);

      const { dictionary, indices } = compressDictionary(data);

      expect(dictionary).toHaveLength(3);
      expect(indices).toHaveLength(100);
    });

    test('compresses enum-like values', () => {
      const statuses = ['pending', 'active', 'completed', 'failed'];
      const data = Array(200)
        .fill(null)
        .map((_, i) => statuses[i % 4]!);

      const { dictionary, indices } = compressDictionary(data);

      expect(dictionary).toHaveLength(4);
      expect(indices).toHaveLength(200);
    });
  });
});
