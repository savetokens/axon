import { describe, test, expect, beforeEach } from 'vitest';
import { validateAgainstSchema, validateArrayAgainstSchema } from '../../src/schema/validator';
import { registerSchema, getSchema, listSchemas, globalSchemas } from '../../src/schema/registry';
import type { Schema } from '../../src/types';

describe('Schema Validator', () => {
  beforeEach(() => {
    globalSchemas.clear();
  });

  describe('Basic Validation', () => {
    test('validates object matching schema', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
          { name: 'email', type: 'str' },
        ],
      };

      const data = {
        id: 123,
        name: 'Alice',
        email: 'alice@example.com',
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('rejects data missing required fields', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
        ],
      };

      const data = {
        id: 123,
        // name is missing
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]?.path).toBe('name');
    });

    test('rejects data with wrong type', () => {
      const schema: Schema = {
        name: 'User',
        fields: [{ name: 'id', type: 'i32' }],
      };

      const data = {
        id: 'not-a-number',
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Optional Fields', () => {
    test('allows missing optional fields', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'phone', type: 'str', optional: true },
        ],
      };

      const data = {
        id: 123,
        // phone is optional and missing
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(true);
    });

    test('validates optional fields when present', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'phone', type: 'str', optional: true },
        ],
      };

      const data = {
        id: 123,
        phone: '+1234567890',
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe('Type-Specific Validation', () => {
    test('validates integer ranges', () => {
      const schema: Schema = {
        name: 'Ranges',
        fields: [
          { name: 'tiny', type: 'i8' },
          { name: 'small', type: 'u8' },
        ],
      };

      // Valid
      expect(validateAgainstSchema({ tiny: 127, small: 255 }, schema).valid).toBe(true);
      expect(validateAgainstSchema({ tiny: -128, small: 0 }, schema).valid).toBe(true);

      // Out of range
      expect(validateAgainstSchema({ tiny: 128, small: 255 }, schema).valid).toBe(false);
      expect(validateAgainstSchema({ tiny: -128, small: 256 }, schema).valid).toBe(false);
    });

    test('validates date format', () => {
      const schema: Schema = {
        name: 'Event',
        fields: [{ name: 'date', type: 'date' }],
      };

      expect(validateAgainstSchema({ date: '2025-01-15' }, schema).valid).toBe(true);
      expect(validateAgainstSchema({ date: 'not-a-date' }, schema).valid).toBe(false);
      expect(validateAgainstSchema({ date: '2025-13-01' }, schema).valid).toBe(false);
    });

    test('validates ISO-8601 timestamps', () => {
      const schema: Schema = {
        name: 'Log',
        fields: [{ name: 'timestamp', type: 'iso8601' }],
      };

      expect(validateAgainstSchema({ timestamp: '2025-01-15T10:30:00Z' }, schema).valid).toBe(true);
      expect(validateAgainstSchema({ timestamp: '2025-01-15' }, schema).valid).toBe(false);
    });

    test('validates UUID format', () => {
      const schema: Schema = {
        name: 'Entity',
        fields: [{ name: 'id', type: 'uuid' }],
      };

      expect(validateAgainstSchema({ id: '550e8400-e29b-41d4-a716-446655440000' }, schema).valid).toBe(true);
      expect(validateAgainstSchema({ id: 'not-a-uuid' }, schema).valid).toBe(false);
    });

    test('validates enum values', () => {
      const schema: Schema = {
        name: 'Order',
        fields: [{ name: 'status', type: 'enum(pending,shipped,delivered)' }],
      };

      expect(validateAgainstSchema({ status: 'shipped' }, schema).valid).toBe(true);
      expect(validateAgainstSchema({ status: 'invalid' }, schema).valid).toBe(false);
    });
  });

  describe('Array Validation', () => {
    test('validates array of objects against schema', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
        ],
      };

      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      const result = validateArrayAgainstSchema(data, schema);

      expect(result.valid).toBe(true);
    });

    test('reports errors with array indices', () => {
      const schema: Schema = {
        name: 'User',
        fields: [{ name: 'id', type: 'i32' }],
      };

      const data = [
        { id: 1 },
        { id: 'invalid' }, // Wrong type at index 1
        { id: 3 },
      ];

      const result = validateArrayAgainstSchema(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]?.path).toContain('[1]');
    });
  });

  describe('Complex Schemas', () => {
    test('validates schema with multiple types', () => {
      const schema: Schema = {
        name: 'ComplexUser',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'uuid', type: 'uuid' },
          { name: 'name', type: 'str' },
          { name: 'email', type: 'str' },
          { name: 'age', type: 'u8' },
          { name: 'active', type: 'bool' },
          { name: 'created', type: 'iso8601' },
          { name: 'role', type: 'enum(admin,user,guest)' },
        ],
      };

      const data = {
        id: 123,
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
        active: true,
        created: '2025-01-15T10:30:00Z',
        role: 'admin',
      };

      const result = validateAgainstSchema(data, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe('Global Schema Functions', () => {
    test('works with global registry', () => {
      const schema: Schema = {
        name: 'GlobalUser',
        fields: [{ name: 'id', type: 'i32' }],
      };

      registerSchema(schema);

      expect(getSchema('GlobalUser')).toEqual(schema);
    });

    test('listSchemas returns all schemas', () => {
      registerSchema({ name: 'User', fields: [{ name: 'id', type: 'i32' }] });
      registerSchema({ name: 'Product', fields: [{ name: 'sku', type: 'str' }] });

      const schemas = listSchemas();
      expect(schemas).toHaveLength(2);
    });
  });
});
