import { describe, test, expect, beforeEach } from 'vitest';
import {
  parseEnumDefinition,
  validateEnum,
  isEnumType,
  EnumRegistry,
  globalEnums,
} from '../../src/types/enum';

describe('Enum Types', () => {
  describe('Enum Definition Parsing', () => {
    test('parses valid enum definitions', () => {
      expect(parseEnumDefinition('enum(pending,active,completed)')).toEqual([
        'pending',
        'active',
        'completed',
      ]);

      expect(parseEnumDefinition('enum(red,green,blue)')).toEqual(['red', 'green', 'blue']);

      expect(parseEnumDefinition('enum(admin,user,guest)')).toEqual(['admin', 'user', 'guest']);
    });

    test('handles whitespace in enum values', () => {
      expect(parseEnumDefinition('enum(pending, active, completed)')).toEqual([
        'pending',
        'active',
        'completed',
      ]);
    });

    test('rejects invalid enum definitions', () => {
      expect(parseEnumDefinition('not-an-enum')).toBeNull();
      expect(parseEnumDefinition('enum()')).toBeNull(); // Empty
      expect(parseEnumDefinition('enum(,)')).toBeNull(); // Empty values
      expect(parseEnumDefinition('enum')).toBeNull(); // Missing parens
    });
  });

  describe('Enum Type Detection', () => {
    test('detects enum types', () => {
      expect(isEnumType('enum(pending,active,completed)')).toBe(true);
      expect(isEnumType('enum(a,b,c)')).toBe(true);
    });

    test('rejects non-enum types', () => {
      expect(isEnumType('str')).toBe(false);
      expect(isEnumType('i32')).toBe(false);
      expect(isEnumType('bool')).toBe(false);
      expect(isEnumType('not-enum')).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    test('validates values against enum', () => {
      const values = ['pending', 'active', 'completed'];

      expect(validateEnum('pending', values)).toBe(true);
      expect(validateEnum('active', values)).toBe(true);
      expect(validateEnum('completed', values)).toBe(true);
    });

    test('rejects values not in enum', () => {
      const values = ['pending', 'active', 'completed'];

      expect(validateEnum('invalid', values)).toBe(false);
      expect(validateEnum('cancelled', values)).toBe(false);
      expect(validateEnum('', values)).toBe(false);
    });

    test('handles numeric values', () => {
      const values = ['1', '2', '3'];

      expect(validateEnum(1, values)).toBe(true);
      expect(validateEnum('1', values)).toBe(true);
      expect(validateEnum(4, values)).toBe(false);
    });
  });

  describe('Enum Registry', () => {
    let registry: EnumRegistry;

    beforeEach(() => {
      registry = new EnumRegistry();
    });

    test('registers and retrieves enums', () => {
      registry.register('OrderStatus', ['pending', 'shipped', 'delivered']);

      expect(registry.has('OrderStatus')).toBe(true);
      expect(registry.get('OrderStatus')).toEqual(['pending', 'shipped', 'delivered']);
    });

    test('returns undefined for non-existent enums', () => {
      expect(registry.get('NonExistent')).toBeUndefined();
      expect(registry.has('NonExistent')).toBe(false);
    });

    test('validates values against registered enums', () => {
      registry.register('Status', ['active', 'inactive']);

      expect(registry.validate('Status', 'active')).toBe(true);
      expect(registry.validate('Status', 'inactive')).toBe(true);
      expect(registry.validate('Status', 'invalid')).toBe(false);
    });

    test('returns false for validation against non-existent enum', () => {
      expect(registry.validate('NonExistent', 'value')).toBe(false);
    });

    test('lists all enum names', () => {
      registry.register('Status', ['active', 'inactive']);
      registry.register('Role', ['admin', 'user']);
      registry.register('Priority', ['low', 'high']);

      const names = registry.names();
      expect(names).toHaveLength(3);
      expect(names).toContain('Status');
      expect(names).toContain('Role');
      expect(names).toContain('Priority');
    });

    test('clears all enums', () => {
      registry.register('Status', ['active', 'inactive']);
      registry.register('Role', ['admin', 'user']);

      expect(registry.names()).toHaveLength(2);

      registry.clear();

      expect(registry.names()).toHaveLength(0);
      expect(registry.has('Status')).toBe(false);
    });

    test('overwrites enum with same name', () => {
      registry.register('Status', ['old1', 'old2']);
      registry.register('Status', ['new1', 'new2', 'new3']);

      expect(registry.get('Status')).toEqual(['new1', 'new2', 'new3']);
    });
  });

  describe('Global Enum Registry', () => {
    beforeEach(() => {
      globalEnums.clear();
    });

    test('works as singleton', () => {
      globalEnums.register('TestEnum', ['value1', 'value2']);

      expect(globalEnums.has('TestEnum')).toBe(true);
      expect(globalEnums.get('TestEnum')).toEqual(['value1', 'value2']);
    });

    test('persists across imports', () => {
      globalEnums.register('Persistent', ['a', 'b']);

      // Simulate different module accessing it
      const values = globalEnums.get('Persistent');
      expect(values).toEqual(['a', 'b']);
    });
  });

  describe('Real-World Scenarios', () => {
    test('order status enum', () => {
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

      expect(validateEnum('shipped', statuses)).toBe(true);
      expect(validateEnum('unknown', statuses)).toBe(false);
    });

    test('user role enum', () => {
      const roles = ['guest', 'user', 'moderator', 'admin', 'superadmin'];

      expect(validateEnum('admin', roles)).toBe(true);
      expect(validateEnum('owner', roles)).toBe(false);
    });

    test('priority enum', () => {
      const priorities = ['low', 'medium', 'high', 'urgent', 'critical'];

      expect(validateEnum('urgent', priorities)).toBe(true);
      expect(validateEnum('normal', priorities)).toBe(false);
    });
  });
});
