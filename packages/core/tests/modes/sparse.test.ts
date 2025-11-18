import { describe, test, expect } from 'vitest';
import { shouldUseSparse, encodeSparse, getSparsityRatio } from '../../src/encoder/modes/sparse';

describe('Sparse Mode', () => {
  describe('Mode Detection', () => {
    test('recommends sparse for null-heavy data', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        field1: i % 3 === 0 ? 'value' : null,
        field2: i % 4 === 0 ? 'value' : null,
        field3: i % 5 === 0 ? 'value' : null,
        field4: i % 7 === 0 ? 'value' : null,
      }));

      expect(shouldUseSparse(data)).toBe(true);
    });

    test('does not recommend for dense data', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        email: `user${i}@example.com`,
      }));

      expect(shouldUseSparse(data)).toBe(false);
    });

    test('does not recommend for small arrays', () => {
      const data = [
        { id: 1, phone: null },
        { id: 2, phone: null },
      ];

      expect(shouldUseSparse(data)).toBe(false);
    });
  });

  describe('Sparsity Calculation', () => {
    test('calculates sparsity ratio correctly', () => {
      const data = [
        { a: 1, b: null, c: null },
        { a: 2, b: null, c: null },
        { a: 3, b: null, c: null },
      ];

      const ratio = getSparsityRatio(data);
      // 9 total fields, 6 nulls = 66.7%
      expect(ratio).toBeCloseTo(0.667, 2);
    });

    test('returns 0 for no nulls', () => {
      const data = [
        { a: 1, b: 2, c: 3 },
        { a: 4, b: 5, c: 6 },
      ];

      const ratio = getSparsityRatio(data);
      expect(ratio).toBe(0);
    });

    test('returns 1 for all nulls', () => {
      const data = [
        { a: null, b: null },
        { a: null, b: null },
      ];

      const ratio = getSparsityRatio(data);
      expect(ratio).toBe(1);
    });
  });

  describe('Sparse Encoding', () => {
    test('marks optional fields with ?', () => {
      const fields = ['id', 'name', 'phone'];
      const data = [
        { id: 1, name: 'Alice', phone: '+123' },
        { id: 2, name: 'Bob', phone: null },
      ];

      const encoded = encodeSparse(data, fields, 'users');

      expect(encoded).toContain('@sparse');
      expect(encoded).toContain('phone?'); // Optional field
    });

    test('omits null values in data rows', () => {
      const fields = ['id', 'name', 'phone'];
      const data = [
        { id: 1, name: 'Alice', phone: null },
        { id: 2, name: 'Bob', phone: '+123' },
      ];

      const encoded = encodeSparse(data, fields, 'users');

      const lines = encoded.split('\n');
      // First data row should have empty phone
      expect(lines[1]).toContain('Alice|');
      // Second data row should have phone value
      expect(lines[2]).toContain('+123');
    });
  });

  describe('Real-World Scenarios', () => {
    test('contact records with optional fields', () => {
      // Create data with >50% null fields
      const contacts = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        field1: i % 3 === 0 ? 'value' : null,
        field2: i % 4 === 0 ? 'value' : null,
        field3: i % 5 === 0 ? 'value' : null,
        field4: i % 7 === 0 ? 'value' : null,
        field5: i % 11 === 0 ? 'value' : null,
      }));

      expect(shouldUseSparse(contacts)).toBe(true);

      const sparsity = getSparsityRatio(contacts);
      expect(sparsity).toBeGreaterThan(0.5);
    });
  });
});
