import { describe, test, expect } from 'vitest';
import { shouldUseStream, encodeStream } from '../../src/encoder/modes/stream';

describe('Stream Mode', () => {
  describe('Mode Detection', () => {
    test('recommends stream for time-series data', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`,
        value: 100 + i,
      }));

      expect(shouldUseStream(data)).toBe(true);
    });

    test('recommends stream for data with date field', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        views: 1000 + i,
      }));

      expect(shouldUseStream(data)).toBe(true);
    });

    test('does not recommend for non-temporal data', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
        value: i * 10,
      }));

      expect(shouldUseStream(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = [
        { timestamp: '2025-01-01T00:00:00Z', value: 100 },
        { timestamp: '2025-01-01T01:00:00Z', value: 110 },
      ];

      expect(shouldUseStream(data)).toBe(false);
    });
  });

  describe('Stream Encoding', () => {
    test('encodes time-series data', () => {
      const data = [
        { timestamp: '2025-01-01T00:00:00Z', value: 100 },
        { timestamp: '2025-01-01T01:00:00Z', value: 110 },
        { timestamp: '2025-01-01T02:00:00Z', value: 120 },
      ];

      const encoded = encodeStream(data, 'metrics');

      expect(encoded).toContain('@stream');
      expect(encoded).toContain('timestamp');
      expect(encoded).toContain('value');
    });

    test('handles empty arrays', () => {
      const encoded = encodeStream([], 'metrics');
      expect(encoded).toBe('metrics::[0]@stream:');
    });
  });

  describe('Real-World Scenarios', () => {
    test('server metrics with timestamps', () => {
      const metrics = Array.from({ length: 1440 }, (_, i) => ({
        timestamp: new Date(2025, 0, 1, 0, i).toISOString(),
        cpu: 10 + Math.random() * 5,
        memory: 50 + Math.random() * 10,
        disk: 70 + Math.random() * 5,
      }));

      expect(shouldUseStream(metrics)).toBe(true);
    });

    test('stock prices with date', () => {
      const prices = Array.from({ length: 252 }, (_, i) => ({
        date: `2025-${String(Math.floor(i / 21) + 1).padStart(2, '0')}-${String((i % 21) + 1).padStart(2, '0')}`,
        open: 150 + Math.random() * 10,
        close: 150 + Math.random() * 10,
        volume: Math.floor(Math.random() * 1000000),
      }));

      expect(shouldUseStream(prices)).toBe(true);
    });
  });
});
