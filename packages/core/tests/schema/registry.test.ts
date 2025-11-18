import { describe, test, expect, beforeEach } from 'vitest';
import { SchemaRegistry, globalSchemas, registerSchema, getSchema, listSchemas } from '../../src/schema/registry';
import type { Schema } from '../../src/types';
import { AXONSchemaError } from '../../src/utils/errors';

describe('Schema Registry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry();
    globalSchemas.clear();
  });

  describe('Schema Registration', () => {
    test('registers valid schema', () => {
      const schema: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
          { name: 'email', type: 'str' },
        ],
      };

      registry.register(schema);

      expect(registry.has('User')).toBe(true);
      expect(registry.get('User')).toEqual(schema);
    });

    test('throws on schema with no name', () => {
      const schema: Schema = {
        name: '',
        fields: [{ name: 'id', type: 'i32' }],
      };

      expect(() => registry.register(schema)).toThrow(AXONSchemaError);
    });

    test('throws on schema with no fields', () => {
      const schema: Schema = {
        name: 'Empty',
        fields: [],
      };

      expect(() => registry.register(schema)).toThrow(AXONSchemaError);
    });

    test('throws on duplicate field names', () => {
      const schema: Schema = {
        name: 'Invalid',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'id', type: 'str' }, // Duplicate!
        ],
      };

      expect(() => registry.register(schema)).toThrow(AXONSchemaError);
    });

    test('allows overwriting schema with same name', () => {
      const schema1: Schema = {
        name: 'User',
        fields: [{ name: 'id', type: 'i32' }],
      };

      const schema2: Schema = {
        name: 'User',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
        ],
      };

      registry.register(schema1);
      registry.register(schema2);

      expect(registry.get('User')).toEqual(schema2);
    });
  });

  describe('Schema Retrieval', () => {
    test('returns undefined for non-existent schema', () => {
      expect(registry.get('NonExistent')).toBeUndefined();
      expect(registry.has('NonExistent')).toBe(false);
    });

    test('lists all schema names', () => {
      registry.register({ name: 'User', fields: [{ name: 'id', type: 'i32' }] });
      registry.register({ name: 'Product', fields: [{ name: 'sku', type: 'str' }] });
      registry.register({ name: 'Order', fields: [{ name: 'id', type: 'str' }] });

      const names = registry.names();
      expect(names).toHaveLength(3);
      expect(names).toContain('User');
      expect(names).toContain('Product');
      expect(names).toContain('Order');
    });
  });

  describe('Schema Deletion', () => {
    test('deletes schema', () => {
      registry.register({ name: 'User', fields: [{ name: 'id', type: 'i32' }] });

      expect(registry.has('User')).toBe(true);

      registry.delete('User');

      expect(registry.has('User')).toBe(false);
    });

    test('returns false when deleting non-existent schema', () => {
      expect(registry.delete('NonExistent')).toBe(false);
    });
  });

  describe('Schema Inheritance', () => {
    test('resolves simple inheritance', () => {
      const baseSchema: Schema = {
        name: 'BaseUser',
        fields: [
          { name: 'id', type: 'i32' },
          { name: 'name', type: 'str' },
        ],
      };

      const extendedSchema: Schema = {
        name: 'AdminUser',
        extends: 'BaseUser',
        fields: [
          { name: 'permissions', type: 'str' },
          { name: 'lastLogin', type: 'iso8601' },
        ],
      };

      registry.register(baseSchema);
      registry.register(extendedSchema);

      const resolved = registry.getResolved('AdminUser');

      expect(resolved).toBeDefined();
      expect(resolved!.fields).toHaveLength(4); // 2 from base + 2 from extended
      expect(resolved!.fields[0]?.name).toBe('id');
      expect(resolved!.fields[1]?.name).toBe('name');
      expect(resolved!.fields[2]?.name).toBe('permissions');
      expect(resolved!.fields[3]?.name).toBe('lastLogin');
    });

    test('throws on missing parent schema', () => {
      const schema: Schema = {
        name: 'Child',
        extends: 'NonExistent',
        fields: [{ name: 'extra', type: 'str' }],
      };

      registry.register(schema);

      expect(() => registry.getResolved('Child')).toThrow(AXONSchemaError);
    });

    test('returns schema as-is when no inheritance', () => {
      const schema: Schema = {
        name: 'Simple',
        fields: [{ name: 'id', type: 'i32' }],
      };

      registry.register(schema);

      const resolved = registry.getResolved('Simple');
      expect(resolved).toEqual(schema);
    });
  });

  describe('Global Schema Functions', () => {
    test('registerSchema works globally', () => {
      const schema: Schema = {
        name: 'GlobalUser',
        fields: [{ name: 'id', type: 'i32' }],
      };

      registerSchema(schema);

      expect(getSchema('GlobalUser')).toEqual(schema);
    });

    test('listSchemas returns all registered schemas', () => {
      registerSchema({ name: 'User', fields: [{ name: 'id', type: 'i32' }] });
      registerSchema({ name: 'Product', fields: [{ name: 'sku', type: 'str' }] });

      const schemas = listSchemas();
      expect(schemas).toHaveLength(2);
      expect(schemas.some((s) => s.name === 'User')).toBe(true);
      expect(schemas.some((s) => s.name === 'Product')).toBe(true);
    });
  });
});
