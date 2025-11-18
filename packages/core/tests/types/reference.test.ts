import { describe, test, expect } from 'vitest';
import {
  parseReferenceDefinition,
  isReferenceType,
  createReference,
  createReferenceMetadata,
} from '../../src/types/reference';

describe('Reference Types', () => {
  describe('Reference Definition Parsing', () => {
    test('parses valid reference definitions', () => {
      expect(parseReferenceDefinition('ref(users)')).toBe('users');
      expect(parseReferenceDefinition('ref(products)')).toBe('products');
      expect(parseReferenceDefinition('ref(orders)')).toBe('orders');
    });

    test('handles whitespace', () => {
      expect(parseReferenceDefinition('ref( users )')).toBe('users');
      expect(parseReferenceDefinition('ref(  products  )')).toBe('products');
    });

    test('rejects invalid reference definitions', () => {
      expect(parseReferenceDefinition('not-a-ref')).toBeNull();
      expect(parseReferenceDefinition('ref()')).toBeNull(); // Empty
      expect(parseReferenceDefinition('ref')).toBeNull(); // Missing parens
      expect(parseReferenceDefinition('users')).toBeNull(); // Missing ref()
    });
  });

  describe('Reference Type Detection', () => {
    test('detects reference types', () => {
      expect(isReferenceType('ref(users)')).toBe(true);
      expect(isReferenceType('ref(products)')).toBe(true);
      expect(isReferenceType('ref(table_name)')).toBe(true);
    });

    test('rejects non-reference types', () => {
      expect(isReferenceType('str')).toBe(false);
      expect(isReferenceType('i32')).toBe(false);
      expect(isReferenceType('enum(a,b,c)')).toBe(false);
      expect(isReferenceType('users')).toBe(false);
    });
  });

  describe('Reference Creation', () => {
    test('creates reference type strings', () => {
      expect(createReference('users')).toBe('ref(users)');
      expect(createReference('products')).toBe('ref(products)');
      expect(createReference('table_name')).toBe('ref(table_name)');
    });
  });

  describe('Reference Metadata', () => {
    test('creates reference metadata', () => {
      const metadata = createReferenceMetadata('users', 123);

      expect(metadata.targetTable).toBe('users');
      expect(metadata.value).toBe(123);
    });

    test('handles various value types', () => {
      const numRef = createReferenceMetadata('users', 123);
      expect(numRef.value).toBe(123);

      const strRef = createReferenceMetadata('products', 'SKU-001');
      expect(strRef.value).toBe('SKU-001');

      const uuidRef = createReferenceMetadata('orders', '550e8400-e29b-41d4-a716-446655440000');
      expect(uuidRef.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Real-World Scenarios', () => {
    test('order references customer', () => {
      const customerRef = parseReferenceDefinition('ref(customers)');
      expect(customerRef).toBe('customers');

      const metadata = createReferenceMetadata('customers', 12345);
      expect(metadata.targetTable).toBe('customers');
      expect(metadata.value).toBe(12345);
    });

    test('post references author and category', () => {
      const authorRef = parseReferenceDefinition('ref(users)');
      const categoryRef = parseReferenceDefinition('ref(categories)');

      expect(authorRef).toBe('users');
      expect(categoryRef).toBe('categories');
    });

    test('supports underscore and hyphen in table names', () => {
      expect(parseReferenceDefinition('ref(user_profiles)')).toBe('user_profiles');
      expect(parseReferenceDefinition('ref(order-items)')).toBe('order-items');
    });
  });
});
