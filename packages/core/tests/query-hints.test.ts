import { describe, test, expect } from 'vitest';
import {
  detectPrimaryKey,
  detectSearchFields,
  detectTimeseriesField,
  detectAggregateFields,
  detectJoinFields,
  detectIndexFields,
  generateQueryHints,
  formatQueryHints,
} from '../src/encoder/query-hints';

describe('Query Hints System', () => {
  describe('Primary Key Detection', () => {
    test('detects "id" as primary key', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      expect(detectPrimaryKey(data)).toBe('id');
    });

    test('detects "uuid" as primary key', () => {
      const data = [
        { uuid: '550e8400-e29b-41d4-a716-446655440000', name: 'Alice' },
        { uuid: '550e8400-e29b-41d4-a716-446655440001', name: 'Bob' },
      ];

      expect(detectPrimaryKey(data)).toBe('uuid');
    });

    test('verifies uniqueness', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Bob' }, // Duplicate ID!
      ];

      // Should not return 'id' since not unique
      const pk = detectPrimaryKey(data);
      expect(pk).not.toBe('id');
    });

    test('returns null when no unique field found', () => {
      const data = [
        { value: 'same', other: 'same' },
        { value: 'same', other: 'same' },
      ];

      expect(detectPrimaryKey(data)).toBeNull();
    });
  });

  describe('Search Fields Detection', () => {
    test('detects name fields', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ];

      const searchFields = detectSearchFields(data);
      expect(searchFields).toContain('name');
    });

    test('detects email fields', () => {
      const data = [
        { id: 1, email: 'alice@example.com' },
        { id: 2, email: 'bob@example.com' },
      ];

      const searchFields = detectSearchFields(data);
      expect(searchFields).toContain('email');
    });

    test('detects description fields', () => {
      const data = [
        { id: 1, title: 'Post 1', description: 'Lorem ipsum' },
      ];

      const searchFields = detectSearchFields(data);
      expect(searchFields).toContain('title');
      expect(searchFields).toContain('description');
    });

    test('ignores numeric fields', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
      ];

      const searchFields = detectSearchFields(data);
      expect(searchFields).not.toContain('id');
      expect(searchFields).not.toContain('age');
    });
  });

  describe('Timeseries Field Detection', () => {
    test('detects timestamp field', () => {
      const data = [
        { timestamp: '2025-01-01T00:00:00Z', value: 100 },
      ];

      expect(detectTimeseriesField(data)).toBe('timestamp');
    });

    test('detects created field', () => {
      const data = [
        { id: 1, created: '2025-01-01T00:00:00Z' },
      ];

      expect(detectTimeseriesField(data)).toBe('created');
    });

    test('detects date field', () => {
      const data = [
        { date: '2025-01-01', value: 100 },
      ];

      expect(detectTimeseriesField(data)).toBe('date');
    });

    test('returns null when no time field', () => {
      const data = [
        { id: 1, value: 100 },
      ];

      expect(detectTimeseriesField(data)).toBeNull();
    });
  });

  describe('Aggregate Fields Detection', () => {
    test('detects count fields', () => {
      const data = [
        { id: 1, view_count: 100, click_count: 50 },
      ];

      const aggregateFields = detectAggregateFields(data);
      expect(aggregateFields).toContain('view_count');
      expect(aggregateFields).toContain('click_count');
    });

    test('detects revenue and price fields', () => {
      const data = [
        { id: 1, price: 19.99, revenue: 199.90, quantity: 10 },
      ];

      const aggregateFields = detectAggregateFields(data);
      expect(aggregateFields).toContain('price');
      expect(aggregateFields).toContain('revenue');
      expect(aggregateFields).toContain('quantity');
    });

    test('ignores non-numeric fields', () => {
      const data = [
        { id: 1, total_name: 'should not be detected' },
      ];

      const aggregateFields = detectAggregateFields(data);
      expect(aggregateFields).not.toContain('total_name');
    });
  });

  describe('Join Fields Detection', () => {
    test('detects foreign key fields', () => {
      const data = [
        { id: 1, customer_id: 100, product_id: 200 },
      ];

      const joinFields = detectJoinFields(data);
      expect(joinFields).toContain('customer_id');
      expect(joinFields).toContain('product_id');
    });

    test('detects reference fields', () => {
      const data = [
        { id: 1, user_ref: 100, category_ref: 5 },
      ];

      const joinFields = detectJoinFields(data);
      expect(joinFields).toContain('user_ref');
      expect(joinFields).toContain('category_ref');
    });
  });

  describe('Index Fields Detection', () => {
    test('includes primary key and timestamp', () => {
      const data = [
        { id: 1, created: '2025-01-01T00:00:00Z', value: 100 },
        { id: 2, created: '2025-01-01T01:00:00Z', value: 110 },
      ];

      const indexFields = detectIndexFields(data);
      expect(indexFields).toContain('id');
      expect(indexFields).toContain('created');
    });

    test('includes foreign keys', () => {
      const data = [
        { id: 1, customer_id: 100, product_id: 200 },
      ];

      const indexFields = detectIndexFields(data);
      expect(indexFields).toContain('customer_id');
      expect(indexFields).toContain('product_id');
    });

    test('deduplicates fields', () => {
      const data = [
        { id: 1, value: 100 },
      ];

      const indexFields = detectIndexFields(data);
      const unique = new Set(indexFields);
      expect(indexFields.length).toBe(unique.size);
    });
  });

  describe('Complete Hint Generation', () => {
    test('generates all applicable hints', () => {
      const data = [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@example.com',
          customer_id: 100,
          created: '2025-01-01T00:00:00Z',
          revenue: 199.99,
          quantity: 10,
        },
        {
          id: 2,
          name: 'Bob',
          email: 'bob@example.com',
          customer_id: 101,
          created: '2025-01-01T01:00:00Z',
          revenue: 299.99,
          quantity: 15,
        },
      ];

      const hints = generateQueryHints(data);

      // Should have multiple hints
      expect(hints.length).toBeGreaterThan(0);

      // Check for specific hint types
      const hintTypes = hints.map((h) => h.type);
      expect(hintTypes).toContain('primary');
      expect(hintTypes).toContain('search');
      expect(hintTypes).toContain('timeseries');
      expect(hintTypes).toContain('aggregate');
      expect(hintTypes).toContain('join');
      expect(hintTypes).toContain('index');
    });

    test('formats hints as AXON syntax', () => {
      const hints = [
        { type: 'primary' as const, fields: ['id'] },
        { type: 'search' as const, fields: ['name', 'email'] },
        { type: 'aggregate' as const, fields: ['revenue', 'quantity'] },
      ];

      const formatted = formatQueryHints(hints);

      expect(formatted).toContain('!primary:id');
      expect(formatted).toContain('!search:name,email');
      expect(formatted).toContain('!aggregate:revenue,quantity');
    });
  });

  describe('Real-World Scenarios', () => {
    test('e-commerce orders', () => {
      const orders = [
        {
          id: 'ORD-001',
          customer_id: 12345,
          created: '2025-01-15T10:30:00Z',
          total: 199.99,
          quantity: 3,
          status: 'shipped',
        },
      ];

      const hints = generateQueryHints(orders);
      const hintTypes = hints.map((h) => h.type);

      expect(hintTypes).toContain('primary'); // id
      expect(hintTypes).toContain('timeseries'); // created
      expect(hintTypes).toContain('aggregate'); // total, quantity
      expect(hintTypes).toContain('join'); // customer_id
    });

    test('analytics events', () => {
      const events = [
        {
          event_id: 1,
          user_id: 100,
          timestamp: '2025-01-01T00:00:00Z',
          event_name: 'page_view',
          duration: 45,
          page_title: 'Home Page',
        },
      ];

      const hints = generateQueryHints(events);
      const hintTypes = hints.map((h) => h.type);

      expect(hintTypes).toContain('primary'); // event_id
      expect(hintTypes).toContain('timeseries'); // timestamp
      expect(hintTypes).toContain('join'); // user_id
    });
  });
});
