import { describe, test, expect } from 'vitest';
import { selectMode, getModeRecommendation } from '../../src/encoder/mode-selector';

describe('Adaptive Mode Selection', () => {
  describe('Mode Selection Logic', () => {
    test('selects compact for small uniform arrays', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      expect(selectMode(data)).toBe('compact');
    });

    test('selects columnar for large numeric datasets', () => {
      const data = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        value: i * 10,
        score: i * 2,
      }));

      expect(selectMode(data)).toBe('columnar');
    });

    test('selects stream for time-series', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`,
        value: 100 + i,
      }));

      expect(selectMode(data)).toBe('stream');
    });

    test('selects sparse for null-heavy data', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        field1: i % 5 === 0 ? 'value' : null,
        field2: i % 7 === 0 ? 'value' : null,
        field3: i % 11 === 0 ? 'value' : null,
      }));

      expect(selectMode(data)).toBe('sparse');
    });

    test('selects nested for objects', () => {
      const data = {
        user: {
          name: 'Alice',
          profile: {
            email: 'alice@example.com',
          },
        },
      };

      expect(selectMode(data)).toBe('nested');
    });

    test('selects JSON for non-uniform arrays', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob', extra: 'field' },
        { id: 3 },
      ];

      expect(selectMode(data)).toBe('json');
    });

    test('respects explicit mode option', () => {
      const data = [{ id: 1 }, { id: 2 }];

      expect(selectMode(data, { mode: 'nested' })).toBe('nested');
      expect(selectMode(data, { mode: 'columnar' })).toBe('columnar');
    });
  });

  describe('Mode Recommendation with Reasoning', () => {
    test('provides detailed recommendation for compact mode', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const rec = getModeRecommendation(data);

      expect(rec.mode).toBe('compact');
      expect(rec.reason).toContain('Uniform');
      expect(rec.reason).toContain('compact');
      expect(rec.characteristics.isArray).toBe(true);
      expect(rec.characteristics.length).toBe(2);
      expect(rec.characteristics.isUniform).toBe(true);
    });

    test('provides recommendation for columnar mode', () => {
      const data = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        value: i * 10,
        score: i * 2,
      }));

      const rec = getModeRecommendation(data);

      expect(rec.mode).toBe('columnar');
      expect(rec.reason).toContain('numeric');
      expect(rec.reason).toContain('columnar');
      expect(rec.characteristics.isNumericHeavy).toBe(true);
    });

    test('provides recommendation for sparse mode', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        optional1: i % 5 === 0 ? 'value' : null,
        optional2: i % 7 === 0 ? 'value' : null,
      }));

      const rec = getModeRecommendation(data);

      expect(rec.mode).toBe('sparse');
      expect(rec.reason).toContain('sparsity');
      expect(rec.reason).toContain('sparse');
      expect(rec.characteristics.sparsityRatio).toBeGreaterThan(0.5);
    });

    test('provides recommendation for nested mode', () => {
      const data = {
        nested: {
          deep: {
            value: 123,
          },
        },
      };

      const rec = getModeRecommendation(data);

      expect(rec.mode).toBe('nested');
      expect(rec.reason).toContain('nested');
      expect(rec.characteristics.isArray).toBe(false);
    });
  });

  describe('Priority Order', () => {
    test('sparse takes priority over compact when applicable', () => {
      const sparseData = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        f1: i % 3 === 0 ? i : null,
        f2: i % 4 === 0 ? i : null,
        f3: i % 5 === 0 ? i : null,
      }));

      expect(selectMode(sparseData)).toBe('sparse');
    });

    test('stream takes priority over columnar for time-series', () => {
      const timeData = Array.from({ length: 200 }, (_, i) => ({
        timestamp: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`,
        value: i * 10,
        score: i * 2,
      }));

      expect(selectMode(timeData)).toBe('stream');
    });

    test('columnar for large numeric without timestamps', () => {
      const numericData = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        value: i * 10,
        score: i * 2,
        count: i,
      }));

      expect(selectMode(numericData)).toBe('columnar');
    });
  });
});
