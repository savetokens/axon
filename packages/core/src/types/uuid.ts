/**
 * UUID type validation and conversion
 * Supports: uuid (standard), uuid-short (Base62)
 */

/**
 * Standard UUID pattern (8-4-4-4-12)
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Base62 character set for uuid-short
 */
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Validate standard UUID
 */
export function isUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validate uuid-short (Base62-encoded, typically 22 chars)
 */
export function isUUIDShort(value: string): boolean {
  // uuid-short can be 1-24 characters (1 for zero UUID, up to 22 for typical)
  if (value.length < 1 || value.length > 24) {
    return false;
  }

  return value.split('').every((char) => BASE62_CHARS.includes(char));
}

/**
 * Convert UUID to uuid-short (Base62)
 * Note: This is a simplified conversion for demonstration
 * Production implementation would use proper Base62 encoding
 */
export function uuidToShort(uuid: string): string {
  if (!isUUID(uuid)) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }

  // Remove hyphens
  const hex = uuid.replace(/-/g, '');

  // Convert hex to BigInt
  const num = BigInt('0x' + hex);

  // Convert to Base62
  let result = '';
  let remaining = num;

  while (remaining > 0n) {
    const index = Number(remaining % 62n);
    result = BASE62_CHARS[index] + result;
    remaining = remaining / 62n;
  }

  return result || '0';
}

/**
 * Convert uuid-short (Base62) to standard UUID
 */
export function shortToUUID(short: string): string {
  if (!isUUIDShort(short)) {
    throw new Error(`Invalid uuid-short: ${short}`);
  }

  // Convert Base62 to BigInt
  let num = 0n;
  for (const char of short) {
    const value = BASE62_CHARS.indexOf(char);
    num = num * 62n + BigInt(value);
  }

  // Convert to hex string (32 chars)
  let hex = num.toString(16).padStart(32, '0');

  // Insert hyphens at correct positions
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
