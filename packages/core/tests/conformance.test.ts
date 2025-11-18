import { describe, test, expect } from 'vitest';
import { encode, decode } from '../src';

/**
 * Conformance tests based on examples from the AXON specification (about.md)
 * These tests verify that our implementation matches the spec
 */
describe('Specification Conformance', () => {
  describe('Section 3.1: Basic Example (Compact Mode)', () => {
    test('Example: User list with types', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', role: 'admin', active: true },
          { id: 2, name: 'Bob', role: 'user', active: true },
          { id: 3, name: 'Charlie', role: 'user', active: false },
        ],
      };

      const axon = encode(data);

      // Verify it uses compact mode
      expect(axon).toContain('users::[3]');
      expect(axon).toContain('id:');
      expect(axon).toContain('name:');
      expect(axon).toContain('role:');
      expect(axon).toContain('active:');

      // Verify round-trip
      const decoded = decode(axon);
      expect(decoded).toEqual(data);
    });
  });

  describe('Section 4.1.4: Arrays - Structured Data', () => {
    test('Example: Users compact format', () => {
      // Manual AXON from spec
      const axon = `users::[3] id:u8|name:str|role:str
  1|Alice|admin
  2|Bob|user
  3|Charlie|guest`;

      const decoded = decode(axon);

      expect(decoded).toEqual({
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
          { id: 3, name: 'Charlie', role: 'guest' },
        ],
      });
    });
  });

  describe('Section 4.3: String Quoting Rules', () => {
    test('Unquoted strings for simple values', () => {
      const axon = 'users::[1] name:str|email:str\n  Alice|alice@example.com';
      const decoded = decode(axon);

      expect(decoded.users[0].name).toBe('Alice');
      expect(decoded.users[0].email).toBe('alice@example.com');
    });

    test('Quoted strings for values with spaces', () => {
      const data = {
        users: [{ name: 'Alice Johnson' }],
      };

      const axon = encode(data);
      expect(axon).toContain('"Alice Johnson"');

      const decoded = decode(axon);
      expect(decoded).toEqual(data);
    });
  });

  describe('Section 6.2: Compact Mode Examples', () => {
    test('Example 1: User List', () => {
      const axon = `users::[3] id:u8|name:str|role:str|active:bool
  1|Alice|admin|true
  2|Bob|user|true
  3|Charlie|user|false`;

      const decoded = decode(axon);

      expect(decoded.users).toHaveLength(3);
      expect(decoded.users[0]).toEqual({ id: 1, name: 'Alice', role: 'admin', active: true });
      expect(decoded.users[1]).toEqual({ id: 2, name: 'Bob', role: 'user', active: true });
      expect(decoded.users[2]).toEqual({
        id: 3,
        name: 'Charlie',
        role: 'user',
        active: false,
      });
    });

    test('Example 2: Product Catalog', () => {
      const data = {
        products: [
          { sku: 'WDG-001', name: 'Premium Widget', price: 19.99, stock: 150 },
          { sku: 'GDG-042', name: 'Smart Gadget', price: 149.99, stock: 89 },
          { sku: 'SHT-103', name: 'Cotton Shirt', price: 24.5, stock: 200 },
        ],
      };

      const axon = encode(data);
      const decoded = decode(axon);

      expect(decoded).toEqual(data);
    });
  });

  describe('Round-Trip Preservation', () => {
    test('preserves all JavaScript types in compact mode', () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1', price: 10.5, active: true },
          { id: 2, name: 'Item 2', price: 20.99, active: false },
        ],
      };

      const axon = encode(data);
      const decoded = decode(axon);

      expect(decoded).toEqual(data);
    });

    test('handles large arrays efficiently', () => {
      const data = {
        records: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          value: i * 2,
          label: `Item ${i + 1}`,
        })),
      };

      const axon = encode(data);
      const decoded = decode(axon);

      expect(decoded).toEqual(data);
      expect(decoded.records).toHaveLength(50);
    });

    test('handles mixed value types', () => {
      const data = {
        mixed: [
          { num: 42, text: 'hello', flag: true },
          { num: 100, text: 'world', flag: false },
        ],
      };

      const axon = encode(data);
      const decoded = decode(axon);

      expect(decoded).toEqual(data);
    });
  });

  describe('Token Efficiency', () => {
    test('AXON is significantly shorter than JSON', () => {
      const data = {
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `User${i + 1}`,
          active: i % 2 === 0,
        })),
      };

      const axonStr = encode(data);
      const jsonStr = JSON.stringify(data, null, 2);

      // AXON should be at least 40% shorter
      expect(axonStr.length).toBeLessThan(jsonStr.length * 0.6);
    });
  });
});
