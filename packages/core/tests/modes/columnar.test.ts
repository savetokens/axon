import { describe, test, expect } from 'vitest';
import { shouldUseColumnar, encodeColumnar, decodeColumnar } from '../../src/encoder/modes/columnar';

describe('Columnar Mode', () => {
  describe('Mode Detection', () => {
    test('recommends columnar for large numeric datasets', () => {
      const data = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        value: i * 10,
        score: Math.random() * 100,
      }));

      expect(shouldUseColumnar(data)).toBe(true);
    });

    test('does not recommend for small datasets', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        value: i * 10,
      }));

      expect(shouldUseColumnar(data)).toBe(false);
    });

    test('does not recommend for non-numeric data', () => {
      const data = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        email: `user${i}@example.com`,
      }));

      expect(shouldUseColumnar(data)).toBe(false);
    });

    test('does not recommend for non-uniform data', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, value: 20, extra: 'field' },
        { id: 3, value: 30 },
      ];

      expect(shouldUseColumnar(data)).toBe(false);
    });
  });

  describe('Columnar Encoding', () => {
    test('encodes data in column format', () => {
      const data = [
        { id: 1, value: 10, active: true },
        { id: 2, value: 20, active: false },
        { id: 3, value: 30, active: true },
      ];

      const encoded = encodeColumnar(data, 'metrics');

      expect(encoded).toContain('@columnar');
      expect(encoded).toContain('id:');
      expect(encoded).toContain('value:');
      expect(encoded).toContain('active:');
      expect(encoded).toContain('[1, 2, 3]');
      expect(encoded).toContain('[10, 20, 30]');
    });

    test('handles empty arrays', () => {
      const encoded = encodeColumnar([], 'empty');
      expect(encoded).toBe('empty::[0]@columnar:');
    });
  });

  describe('Columnar Decoding', () => {
    test('reconstructs row-based data from columns', () => {
      const columns = new Map([
        ['id', [1, 2, 3]],
        ['name', ['Alice', 'Bob', 'Charlie']],
        ['score', [95, 87, 92]],
      ]);

      const decoded = decodeColumnar(columns);

      expect(decoded).toEqual([
        { id: 1, name: 'Alice', score: 95 },
        { id: 2, name: 'Bob', score: 87 },
        { id: 3, name: 'Charlie', score: 92 },
      ]);
    });

    test('handles empty columns', () => {
      const columns = new Map();
      const decoded = decodeColumnar(columns);

      expect(decoded).toEqual([]);
    });
  });

  describe('Real-World Scenarios', () => {
    test('analytics data benefits from columnar', () => {
      const analytics = Array.from({ length: 500 }, (_, i) => ({
        day: i + 1,
        views: 1000 + i * 10,
        clicks: 50 + i,
        conversions: 5 + Math.floor(i / 10),
        revenue: (50 + i) * 9.99,
      }));

      expect(shouldUseColumnar(analytics)).toBe(true);

      const encoded = encodeColumnar(analytics, 'analytics');
      expect(encoded).toContain('@columnar');

      // Verify it's significantly more compact than row format
      const rowFormat = analytics.map((a) => JSON.stringify(a)).join('\n');
      expect(encoded.length).toBeLessThan(rowFormat.length);
    });
  });
});
