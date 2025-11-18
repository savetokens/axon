import { describe, test, expect } from 'vitest';
import {
  compressDelta,
  decompressDelta,
  shouldUseDelta,
  compressTimestampDelta,
  decompressTimestampDelta,
} from '../../src/compression/delta';

describe('Delta Encoding', () => {
  describe('Basic Compression', () => {
    test('compresses sequential numbers', () => {
      const data = [100, 101, 102, 103, 104];
      const compressed = compressDelta(data);

      expect(compressed).toBe('100, +1, +1, +1, +1');
    });

    test('handles negative deltas', () => {
      const data = [100, 150, 120, 130, 110];
      const compressed = compressDelta(data);

      expect(compressed).toBe('100, +50, -30, +10, -20');
    });

    test('handles mixed deltas', () => {
      const data = [10, 15, 15, 20, 18];
      const compressed = compressDelta(data);

      expect(compressed).toBe('10, +5, +0, +5, -2');
    });

    test('handles empty array', () => {
      expect(compressDelta([])).toBe('');
    });
  });

  describe('Decompression', () => {
    test('reconstructs original array', () => {
      const compressed = '100, +1, +1, +1, +1';
      const decompressed = decompressDelta(compressed);

      expect(decompressed).toEqual([100, 101, 102, 103, 104]);
    });

    test('handles negative deltas', () => {
      const compressed = '100, +50, -30, +10, -20';
      const decompressed = decompressDelta(compressed);

      expect(decompressed).toEqual([100, 150, 120, 130, 110]);
    });

    test('handles empty string', () => {
      expect(decompressDelta('')).toEqual([]);
    });
  });

  describe('Round-Trip', () => {
    test('preserves data through compress/decompress', () => {
      const original = [1000, 1050, 1020, 1030, 1010, 1040];
      const compressed = compressDelta(original);
      const decompressed = decompressDelta(compressed);

      expect(decompressed).toEqual(original);
    });

    test('works with floats', () => {
      const original = [10.5, 11.2, 10.8, 11.0];
      const compressed = compressDelta(original);
      const decompressed = decompressDelta(compressed);

      // Use toBeCloseTo for float comparison
      decompressed.forEach((val, i) => {
        expect(val).toBeCloseTo(original[i]!, 2);
      });
    });
  });

  describe('Compression Heuristics', () => {
    test('recommends delta for sequential data', () => {
      const data = Array.from({ length: 100 }, (_, i) => 1000 + i);

      expect(shouldUseDelta(data)).toBe(true);
    });

    test('recommends delta for data with small changes', () => {
      const data = Array.from({ length: 100 }, (_, i) => 1000 + (i % 10));

      expect(shouldUseDelta(data)).toBe(true);
    });

    test('does not recommend for highly variable data', () => {
      // Random large jumps
      const data = Array.from({ length: 100 }, (_, i) => Math.floor(Math.random() * 1000000));

      expect(shouldUseDelta(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = [1, 2, 3];

      expect(shouldUseDelta(data)).toBe(false);
    });
  });

  describe('Timestamp Delta Encoding', () => {
    test('compresses timestamps with regular intervals', () => {
      const timestamps = [
        '2025-01-01T00:00:00Z',
        '2025-01-01T01:00:00Z',
        '2025-01-01T02:00:00Z',
        '2025-01-01T03:00:00Z',
      ];

      const compressed = compressTimestampDelta(timestamps);

      expect(compressed).toContain('+3600'); // 1 hour = 3600 seconds
    });

    test('decompresses timestamps correctly', () => {
      const compressed = '2025-01-01T00:00:00.000Z, +3600, +3600, +3600';
      const decompressed = decompressTimestampDelta(compressed);

      expect(decompressed).toHaveLength(4);
      expect(decompressed[0]).toBe('2025-01-01T00:00:00.000Z');
      expect(decompressed[1]).toBe('2025-01-01T01:00:00.000Z');
      expect(decompressed[2]).toBe('2025-01-01T02:00:00.000Z');
      expect(decompressed[3]).toBe('2025-01-01T03:00:00.000Z');
    });

    test('preserves timestamps through round-trip', () => {
      const original = [
        '2025-01-01T10:00:00Z',
        '2025-01-01T10:05:00Z',
        '2025-01-01T10:10:00Z',
      ];

      const compressed = compressTimestampDelta(original);
      const decompressed = decompressTimestampDelta(compressed);

      // Compare timestamps (allow minor millisecond differences)
      expect(decompressed).toHaveLength(original.length);
      decompressed.forEach((ts, i) => {
        const origTime = new Date(original[i]!).getTime();
        const decompTime = new Date(ts).getTime();
        expect(Math.abs(origTime - decompTime)).toBeLessThan(1000); // Within 1 second
      });
    });
  });
});
