import { describe, test, expect } from 'vitest';
import {
  calculateFieldStats,
  calculateDistinctCount,
  generateSummaryStats,
  formatSummaryStats,
  calculateDistribution,
  formatDistribution,
} from '../src/encoder/summary-stats';

describe('Summary Statistics', () => {
  describe('Field Statistics', () => {
    test('calculates complete stats for numeric field', () => {
      const data = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 },
        { value: 50 },
      ];

      const stats = calculateFieldStats(data, 'value');

      expect(stats.field).toBe('value');
      expect(stats.sum).toBe(150);
      expect(stats.avg).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.count).toBe(5);
      expect(stats.median).toBe(30);
      expect(stats.stddev).toBeCloseTo(14.14, 1);
    });

    test('handles empty numeric arrays', () => {
      const data: any[] = [];
      const stats = calculateFieldStats(data, 'value');

      expect(stats.field).toBe('value');
      expect(stats.sum).toBeUndefined();
      expect(stats.avg).toBeUndefined();
    });

    test('calculates median for even-length arrays', () => {
      const data = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 },
      ];

      const stats = calculateFieldStats(data, 'value');
      expect(stats.median).toBe(25); // (20 + 30) / 2
    });

    test('calculates median for odd-length arrays', () => {
      const data = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
      ];

      const stats = calculateFieldStats(data, 'value');
      expect(stats.median).toBe(20);
    });
  });

  describe('Distinct Count', () => {
    test('counts distinct values', () => {
      const data = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' },
        { category: 'A' },
      ];

      const distinct = calculateDistinctCount(data, 'category');
      expect(distinct).toBe(3);
    });

    test('handles all unique values', () => {
      const data = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];

      const distinct = calculateDistinctCount(data, 'id');
      expect(distinct).toBe(3);
    });

    test('handles all same value', () => {
      const data = [
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
      ];

      const distinct = calculateDistinctCount(data, 'status');
      expect(distinct).toBe(1);
    });
  });

  describe('Summary Generation', () => {
    test('generates stats for all numeric fields', () => {
      const data = [
        { id: 1, price: 10, quantity: 5 },
        { id: 2, price: 20, quantity: 10 },
        { id: 3, price: 30, quantity: 15 },
      ];

      const summary = generateSummaryStats(data);

      expect(summary.id).toBeDefined();
      expect(summary.price).toBeDefined();
      expect(summary.quantity).toBeDefined();

      expect(summary.price?.sum).toBe(60);
      expect(summary.quantity?.avg).toBe(10);
    });

    test('handles mixed numeric and string fields', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ];

      const summary = generateSummaryStats(data);

      expect(summary.id?.sum).toBeDefined();
      expect(summary.age?.sum).toBeDefined();
      expect(summary.name?.distinct).toBeDefined();
      expect(summary.name?.sum).toBeUndefined(); // Not numeric
    });

    test('can target specific fields', () => {
      const data = [
        { id: 1, value: 10, other: 20 },
        { id: 2, value: 20, other: 30 },
      ];

      const summary = generateSummaryStats(data, ['value']);

      expect(summary.value).toBeDefined();
      expect(summary.other).toBeUndefined();
      expect(summary.id).toBeUndefined();
    });
  });

  describe('Stats Formatting', () => {
    test('formats stats as AXON @computed block', () => {
      const stats = {
        revenue: {
          field: 'revenue',
          sum: 1250000.50,
          avg: 625.25,
          min: 10.00,
          max: 9999.99,
          count: 2000,
        },
      };

      const formatted = formatSummaryStats(stats);

      expect(formatted).toContain('@computed: {');
      expect(formatted).toContain('revenue_sum: 1250000.5');
      expect(formatted).toContain('revenue_avg: 625.25');
      expect(formatted).toContain('revenue_min: 10');
      expect(formatted).toContain('revenue_max: 9999.99');
      expect(formatted).toContain('}');
    });
  });

  describe('Distribution Calculation', () => {
    test('calculates value distribution', () => {
      const data = [
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
        { status: 'inactive' },
        { status: 'inactive' },
        { status: 'pending' },
      ];

      const distribution = calculateDistribution(data, 'status');

      expect(distribution.active).toBe(3);
      expect(distribution.inactive).toBe(2);
      expect(distribution.pending).toBe(1);
    });

    test('formats distribution as AXON block', () => {
      const distribution = {
        active: 100,
        inactive: 50,
        pending: 25,
      };

      const formatted = formatDistribution('status', distribution);

      expect(formatted).toContain('@distribution: {');
      expect(formatted).toContain('status: {');
      expect(formatted).toContain('active: 100');
      expect(formatted).toContain('inactive: 50');
      expect(formatted).toContain('pending: 25');
    });
  });

  describe('Real-World Scenarios', () => {
    test('e-commerce order statistics', () => {
      const orders = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        customer_id: Math.floor(i / 10) + 1,
        total: (Math.random() * 500 + 50).toFixed(2),
        quantity: Math.floor(Math.random() * 10) + 1,
        created: `2025-01-${String((i % 31) + 1).padStart(2, '0')}T00:00:00Z`,
      }));

      const summary = generateSummaryStats(orders, ['total', 'quantity']);

      expect(summary.total).toBeDefined();
      expect(summary.quantity).toBeDefined();
      expect(summary.total?.count).toBe(1000);
      expect(summary.quantity?.sum).toBeGreaterThan(0);
    });

    test('web analytics summary', () => {
      const analytics = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}`,
        views: Math.floor(Math.random() * 10000) + 1000,
        clicks: Math.floor(Math.random() * 1000) + 100,
        conversions: Math.floor(Math.random() * 100) + 10,
      }));

      const summary = generateSummaryStats(analytics);

      expect(summary.views?.sum).toBeGreaterThan(365000);
      expect(summary.clicks?.avg).toBeGreaterThan(100);
      expect(summary.conversions?.min).toBeGreaterThanOrEqual(10);
      expect(summary.conversions?.max).toBeLessThanOrEqual(110);
    });
  });
});
