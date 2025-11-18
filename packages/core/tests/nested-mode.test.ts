import { describe, test, expect } from 'vitest';
import { encode, decode } from '../src';

describe('Nested Mode', () => {
  describe('Deep Nesting', () => {
    test('handles 3-level deep nesting', () => {
      const original = {
        company: {
          name: 'Acme Corp',
          address: {
            street: '123 Main St',
            city: {
              name: 'Springfield',
              state: 'IL',
              zipcode: 62701,
            },
          },
          employees: 500,
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles 4-level deep nesting', () => {
      const original = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
                number: 42,
              },
            },
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles mixed nesting with primitives at each level', () => {
      const original = {
        root: 'value',
        nested: {
          mid: 'value',
          deeper: {
            deep: 'value',
            number: 123,
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Nested Objects with Arrays', () => {
    test('handles primitive arrays in nested objects', () => {
      const original = {
        user: {
          id: 123,
          name: 'Alice',
          tags: ['admin', 'verified', 'active'],
          scores: [95, 87, 92, 100],
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles multiple arrays in same object', () => {
      const original = {
        data: {
          numbers: [1, 2, 3, 4, 5],
          strings: ['a', 'b', 'c'],
          booleans: [true, false, true],
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles arrays at different nesting levels', () => {
      const original = {
        topLevel: [1, 2, 3],
        nested: {
          midLevel: ['a', 'b', 'c'],
          deeper: {
            deepLevel: [true, false],
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Complex Nested Structures', () => {
    test('handles real-world configuration object', () => {
      const original = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'admin',
            password: 'secret123',
          },
          pool: {
            min: 2,
            max: 10,
            idleTimeout: 30000,
          },
        },
        cache: {
          enabled: true,
          ttl: 3600,
          redis: {
            host: 'redis.local',
            port: 6379,
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles e-commerce order structure', () => {
      const original = {
        order: {
          id: 'ORD-001',
          customer: {
            id: 12345,
            name: 'Alice Johnson',
            email: 'alice@example.com',
          },
          shipping: {
            method: 'express',
            address: {
              street: '456 Oak Ave',
              city: 'Portland',
              zip: '97201',
            },
          },
          total: 267.72,
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty nested objects', () => {
      const original = {
        outer: {
          inner: {},
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });

    test('handles mixed types in nested structure', () => {
      const original = {
        data: {
          string: 'text',
          number: 42,
          boolean: true,
          nested: {
            float: 3.14,
            name: 'value',
          },
        },
      };

      const axon = encode(original);
      const decoded = decode(axon);

      expect(decoded).toEqual(original);
    });
  });
});
