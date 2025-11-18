import { describe, test, expect } from 'vitest';
import { encode, decode } from '../src';

describe('End-to-End Integration Tests', () => {
  describe('Compact Mode', () => {
    test('encodes and decodes simple user array', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
          { id: 3, name: 'Charlie', role: 'guest' },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('encodes and decodes products with different types', () => {
      const original = {
        products: [
          { id: 1, name: 'Widget', price: 19.99, stock: 150, active: true },
          { id: 2, name: 'Gadget', price: 149.99, stock: 89, active: true },
          { id: 3, name: 'Tool', price: 39.99, stock: 200, active: false },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles empty arrays', () => {
      const original = {
        users: [],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles single-item arrays', () => {
      const original = {
        users: [{ id: 1, name: 'Alice' }],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Primitive Values', () => {
    test('handles strings with spaces', () => {
      const original = {
        users: [{ id: 1, name: 'Alice Johnson' }],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles boolean values', () => {
      const original = {
        flags: [
          { active: true, verified: false },
          { active: false, verified: true },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test.skip('handles null values (Phase 2: requires optional type support)', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', phone: null },
          { id: 2, name: 'Bob', phone: null },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles numbers (integers and floats)', () => {
      const original = {
        metrics: [
          { id: 1, count: 42, rate: 3.14 },
          { id: 2, count: 100, rate: 2.71 },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Nested Structures', () => {
    test('encodes and decodes nested objects', () => {
      const original = {
        user: {
          id: 123,
          name: 'Alice',
          profile: {
            email: 'alice@example.com',
            age: 30,
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles nested objects with primitive arrays', () => {
      const original = {
        user: {
          id: 123,
          name: 'Alice',
          tags: ['admin', 'verified', 'active'],
          scores: [95, 87, 92],
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test.skip('handles objects with array fields (Phase 2: nested arrays of objects - advanced)', () => {
      const original = {
        user: {
          id: 123,
          name: 'Alice',
          tags: [
            { id: 1, label: 'admin' },
            { id: 2, label: 'verified' },
          ],
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Type Inference', () => {
    test('infers correct integer types', () => {
      const data = {
        values: [
          { small: 100, medium: 50000, large: 3000000000 },
        ],
      };

      const axon = encode(data);

      // Check that types are inferred (visible in AXON output)
      expect(axon).toContain('u8'); // small value
      expect(axon).toContain('u16'); // medium value
      expect(axon).toContain('u32'); // large value
    });

    test('infers float types for decimals', () => {
      const data = {
        prices: [{ amount: 19.99 }],
      };

      const axon = encode(data);

      expect(axon).toContain('f32');
    });
  });

  describe('Special Characters', () => {
    test('handles strings with special characters', () => {
      const original = {
        messages: [
          { text: 'Hello, World!' },
          { text: 'Line 1\nLine 2' },
          { text: 'Tab\there' },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles quotes in strings', () => {
      const original = {
        quotes: [
          { text: 'She said "Hello"' },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Edge Cases', () => {
    test('handles unquoted simple strings', () => {
      const axon = 'users::[2] id:i32|name:str\n  1|Alice\n  2|Bob';
      const decoded = decode(axon);

      expect(decoded).toEqual({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });
    });

    test('preserves data through multiple encode/decode cycles', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
        ],
      };

      const axon1 = encode(original);
      const decoded1 = decode(axon1);
      const axon2 = encode(decoded1);
      const decoded2 = decode(axon2);

      expect(decoded2).toEqual(original);
    });
  });

  describe('Real-World Examples', () => {
    test('handles e-commerce order data', () => {
      const original = {
        orders: [
          { id: 1001, customer: 'Alice', total: 99.99, status: 'shipped' },
          { id: 1002, customer: 'Bob', total: 149.50, status: 'pending' },
          { id: 1003, customer: 'Charlie', total: 29.99, status: 'delivered' },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles analytics data', () => {
      const original = {
        metrics: [
          { day: 1, views: 1000, clicks: 50, conversions: 5 },
          { day: 2, views: 1200, clicks: 60, conversions: 7 },
          { day: 3, views: 950, clicks: 45, conversions: 4 },
        ],
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });
});
