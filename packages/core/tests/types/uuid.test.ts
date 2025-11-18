import { describe, test, expect } from 'vitest';
import {
  isUUID,
  isUUIDShort,
  uuidToShort,
  shortToUUID,
  generateUUID,
} from '../../src/types/uuid';

describe('UUID Types', () => {
  describe('Standard UUID Validation', () => {
    test('validates correct UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    test('accepts both upper and lower case', () => {
      expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    test('rejects invalid UUIDs', () => {
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false); // Too short
      expect(isUUID('550e8400e29b41d4a716446655440000')).toBe(false); // Missing hyphens
      expect(isUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false); // Invalid hex
    });
  });

  describe('UUID Short Validation', () => {
    test('validates uuid-short format', () => {
      expect(isUUIDShort('7N42dgm5tFLK9N8MT7fHC7')).toBe(true);
      expect(isUUIDShort('abcdefghij123456789ABC')).toBe(true);
    });

    test('rejects invalid uuid-short', () => {
      expect(isUUIDShort('')).toBe(false); // Empty
      expect(isUUIDShort('a'.repeat(30))).toBe(false); // Too long
      expect(isUUIDShort('invalid-chars-!')).toBe(false); // Invalid chars
      expect(isUUIDShort('spaces not allowed')).toBe(false);
      expect(isUUIDShort('special@chars')).toBe(false);
    });
  });

  describe('UUID Conversion', () => {
    test('converts UUID to short and back', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const short = uuidToShort(uuid);

      expect(short).toBeTruthy();
      expect(short.length).toBeGreaterThan(0);
      expect(short.length).toBeLessThan(25);

      const reconstructed = shortToUUID(short);
      expect(reconstructed.toLowerCase()).toBe(uuid.toLowerCase());
    });

    test('handles zero UUID', () => {
      const uuid = '00000000-0000-0000-0000-000000000000';
      const short = uuidToShort(uuid);
      expect(short).toBe('0');

      const reconstructed = shortToUUID(short);
      expect(reconstructed).toBe(uuid);
    });

    test('throws on invalid UUID for conversion', () => {
      expect(() => uuidToShort('invalid')).toThrow();
    });

    test('throws on invalid short for conversion', () => {
      expect(() => shortToUUID('invalid!')).toThrow();
    });
  });

  describe('UUID Generation', () => {
    test('generates valid UUIDs', () => {
      const uuid = generateUUID();
      expect(isUUID(uuid)).toBe(true);
    });

    test('generates unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    test('generates v4 UUIDs (version bit check)', () => {
      const uuid = generateUUID();
      // v4 UUID has '4' at position 14
      expect(uuid[14]).toBe('4');
    });
  });

  describe('Round-Trip Conversion', () => {
    test('preserves UUID through multiple conversions', () => {
      const original = '123e4567-e89b-12d3-a456-426614174000';

      const short1 = uuidToShort(original);
      const uuid1 = shortToUUID(short1);
      const short2 = uuidToShort(uuid1);
      const uuid2 = shortToUUID(short2);

      expect(uuid2.toLowerCase()).toBe(original.toLowerCase());
    });

    test('short form is significantly shorter', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const short = uuidToShort(uuid);

      // UUID: 36 chars (with hyphens)
      // Short: ~22 chars (39% reduction)
      expect(uuid.length).toBe(36);
      expect(short.length).toBeLessThan(25);
      expect(short.length).toBeGreaterThan(15);
    });
  });

  describe('Edge Cases', () => {
    test('handles maximum UUID value', () => {
      const maxUUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const short = uuidToShort(maxUUID);
      const reconstructed = shortToUUID(short);

      expect(reconstructed.toLowerCase()).toBe(maxUUID);
    });

    test('handles various UUID formats from generators', () => {
      const uuids = [
        generateUUID(),
        generateUUID(),
        generateUUID(),
      ];

      uuids.forEach((uuid) => {
        expect(isUUID(uuid)).toBe(true);
        const short = uuidToShort(uuid);
        expect(isUUIDShort(short)).toBe(true);
        const reconstructed = shortToUUID(short);
        expect(reconstructed.toLowerCase()).toBe(uuid.toLowerCase());
      });
    });
  });
});
