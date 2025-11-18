import { describe, test, expect } from 'vitest';
import {
  parseDate,
  parseTime,
  parseISO8601,
  isDate,
  isTime,
  isISO8601,
  formatDate,
  formatISO8601,
} from '../../src/types/temporal';

describe('Temporal Types', () => {
  describe('Date Parsing', () => {
    test('parses valid dates', () => {
      expect(parseDate('2025-01-15')).toBeInstanceOf(Date);
      expect(parseDate('2025-12-31')).toBeInstanceOf(Date);
      expect(parseDate('2024-02-29')).toBeInstanceOf(Date); // Leap year
    });

    test('rejects invalid dates', () => {
      expect(parseDate('2025-13-01')).toBeNull(); // Invalid month
      expect(parseDate('2025-01-32')).toBeNull(); // Invalid day
      expect(parseDate('2023-02-29')).toBeNull(); // Not a leap year
      expect(parseDate('25-01-15')).toBeNull(); // Wrong format
      expect(parseDate('2025/01/15')).toBeNull(); // Wrong separator
    });

    test('formats dates correctly', () => {
      const date = new Date('2025-01-15T00:00:00.000Z');
      expect(formatDate(date)).toBe('2025-01-15');
    });
  });

  describe('Time Parsing', () => {
    test('parses valid times', () => {
      expect(parseTime('10:30:00')).toEqual({
        hours: 10,
        minutes: 30,
        seconds: 0,
        milliseconds: 0,
      });

      expect(parseTime('23:59:59')).toEqual({
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 0,
      });

      expect(parseTime('00:00:00.123')).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 123,
      });
    });

    test('rejects invalid times', () => {
      expect(parseTime('24:00:00')).toBeNull(); // Invalid hour
      expect(parseTime('10:60:00')).toBeNull(); // Invalid minute
      expect(parseTime('10:30:60')).toBeNull(); // Invalid second
      expect(parseTime('10:30')).toBeNull(); // Missing seconds
      expect(parseTime('10-30-00')).toBeNull(); // Wrong separator
    });
  });

  describe('ISO 8601 Parsing', () => {
    test('parses valid ISO 8601 timestamps', () => {
      expect(parseISO8601('2025-01-15T10:30:00Z')).toBeInstanceOf(Date);
      expect(parseISO8601('2025-01-15T10:30:00.123Z')).toBeInstanceOf(Date);
      expect(parseISO8601('2025-01-15T10:30:00+01:00')).toBeInstanceOf(Date);
      expect(parseISO8601('2025-01-15T10:30:00-05:00')).toBeInstanceOf(Date);
    });

    test('rejects invalid ISO 8601', () => {
      expect(parseISO8601('2025-01-15')).toBeNull(); // Just a date
      expect(parseISO8601('10:30:00')).toBeNull(); // Just a time
      expect(parseISO8601('2025-01-15 10:30:00')).toBeNull(); // Wrong separator
    });

    test('formats ISO 8601 correctly', () => {
      const date = new Date('2025-01-15T10:30:00.123Z');
      const formatted = formatISO8601(date);
      expect(formatted).toBe('2025-01-15T10:30:00.123Z');
    });
  });

  describe('Type Detection', () => {
    test('detects dates', () => {
      expect(isDate('2025-01-15')).toBe(true);
      expect(isDate('2025-12-31')).toBe(true);
      expect(isDate('not-a-date')).toBe(false);
      expect(isDate('2025-01-15T10:30:00Z')).toBe(false); // ISO 8601, not date
    });

    test('detects times', () => {
      expect(isTime('10:30:00')).toBe(true);
      expect(isTime('23:59:59.999')).toBe(true);
      expect(isTime('not-a-time')).toBe(false);
      expect(isTime('10:30')).toBe(false); // Missing seconds
    });

    test('detects ISO 8601', () => {
      expect(isISO8601('2025-01-15T10:30:00Z')).toBe(true);
      expect(isISO8601('2025-01-15T10:30:00.123Z')).toBe(true);
      expect(isISO8601('2025-01-15T10:30:00+01:00')).toBe(true);
      expect(isISO8601('2025-01-15')).toBe(false); // Just a date
    });

    test('distinguishes between date, time, and ISO 8601', () => {
      const dateStr = '2025-01-15';
      const timeStr = '10:30:00';
      const iso8601Str = '2025-01-15T10:30:00Z';

      expect(isDate(dateStr)).toBe(true);
      expect(isISO8601(dateStr)).toBe(false);

      expect(isTime(timeStr)).toBe(true);
      expect(isISO8601(timeStr)).toBe(false);

      expect(isISO8601(iso8601Str)).toBe(true);
      expect(isDate(iso8601Str)).toBe(false);
      expect(isTime(iso8601Str)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles leap years', () => {
      expect(parseDate('2024-02-29')).toBeInstanceOf(Date); // Leap year
      expect(parseDate('2023-02-29')).toBeNull(); // Not leap year
    });

    test('handles millennium dates', () => {
      expect(parseDate('2000-01-01')).toBeInstanceOf(Date);
      expect(parseDate('1999-12-31')).toBeInstanceOf(Date);
    });

    test('handles timezone offsets', () => {
      const utc = parseISO8601('2025-01-15T10:30:00Z');
      const plus1 = parseISO8601('2025-01-15T11:30:00+01:00');

      expect(utc).toBeInstanceOf(Date);
      expect(plus1).toBeInstanceOf(Date);

      // They should represent the same moment in time
      expect(utc?.getTime()).toBe(plus1?.getTime());
    });
  });
});
