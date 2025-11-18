import type { Schema, ValidationResult } from '../types';
import type { ValidationError } from '../utils/errors';
import { parseEnumDefinition, validateEnum } from '../types/enum';
import { isUUID } from '../types/uuid';
import { isDate, isTime, isISO8601 } from '../types/temporal';

/**
 * Validate data against a schema
 */
export function validateAgainstSchema(data: any, schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];

  // Data must be an object
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      errors: [
        {
          path: '$',
          message: 'Data must be an object',
          expected: 'object',
          actual: typeof data,
        },
      ],
    };
  }

  // Validate each field in schema
  for (const field of schema.fields) {
    const value = data[field.name];

    // Check required fields
    if (value === undefined || value === null) {
      if (!field.optional) {
        errors.push({
          path: field.name,
          message: `Required field '${field.name}' is missing`,
          expected: field.type,
          actual: 'undefined',
        });
      }
      continue;
    }

    // Validate field type
    const fieldError = validateFieldType(field.name, value, field.type);
    if (fieldError) {
      errors.push(fieldError);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate a single field's type
 */
function validateFieldType(fieldName: string, value: any, expectedType: string): ValidationError | null {
  const actualType = typeof value;

  // Integer types
  if (['i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64'].includes(expectedType)) {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return {
        path: fieldName,
        message: `Expected integer for field '${fieldName}'`,
        expected: expectedType,
        actual: actualType,
      };
    }

    // Validate range
    const ranges: Record<string, [number, number]> = {
      i8: [-128, 127],
      i16: [-32768, 32767],
      i32: [-2147483648, 2147483647],
      i64: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      u8: [0, 255],
      u16: [0, 65535],
      u32: [0, 4294967295],
      u64: [0, Number.MAX_SAFE_INTEGER],
    };

    const [min, max] = ranges[expectedType] || [0, 0];
    if (value < min || value > max) {
      return {
        path: fieldName,
        message: `Value ${value} out of range for ${expectedType}`,
        expected: `${min} to ${max}`,
        actual: String(value),
      };
    }

    return null;
  }

  // Float types
  if (expectedType === 'f32' || expectedType === 'f64') {
    if (typeof value !== 'number') {
      return {
        path: fieldName,
        message: `Expected number for field '${fieldName}'`,
        expected: expectedType,
        actual: actualType,
      };
    }
    return null;
  }

  // String
  if (expectedType === 'str') {
    if (typeof value !== 'string') {
      return {
        path: fieldName,
        message: `Expected string for field '${fieldName}'`,
        expected: 'str',
        actual: actualType,
      };
    }
    return null;
  }

  // Boolean
  if (expectedType === 'bool') {
    if (typeof value !== 'boolean') {
      return {
        path: fieldName,
        message: `Expected boolean for field '${fieldName}'`,
        expected: 'bool',
        actual: actualType,
      };
    }
    return null;
  }

  // Null
  if (expectedType === 'null') {
    if (value !== null) {
      return {
        path: fieldName,
        message: `Expected null for field '${fieldName}'`,
        expected: 'null',
        actual: String(value),
      };
    }
    return null;
  }

  // Date
  if (expectedType === 'date') {
    if (typeof value !== 'string' || !isDate(value)) {
      return {
        path: fieldName,
        message: `Expected valid date (YYYY-MM-DD) for field '${fieldName}'`,
        expected: 'date',
        actual: String(value),
      };
    }
    return null;
  }

  // Time
  if (expectedType === 'time') {
    if (typeof value !== 'string' || !isTime(value)) {
      return {
        path: fieldName,
        message: `Expected valid time (HH:MM:SS) for field '${fieldName}'`,
        expected: 'time',
        actual: String(value),
      };
    }
    return null;
  }

  // ISO 8601
  if (expectedType === 'iso8601') {
    if (typeof value !== 'string' || !isISO8601(value)) {
      return {
        path: fieldName,
        message: `Expected valid ISO-8601 timestamp for field '${fieldName}'`,
        expected: 'iso8601',
        actual: String(value),
      };
    }
    return null;
  }

  // UUID
  if (expectedType === 'uuid') {
    if (typeof value !== 'string' || !isUUID(value)) {
      return {
        path: fieldName,
        message: `Expected valid UUID for field '${fieldName}'`,
        expected: 'uuid',
        actual: String(value),
      };
    }
    return null;
  }

  // Enum
  if (expectedType.startsWith('enum(')) {
    const enumValues = parseEnumDefinition(expectedType);
    if (!enumValues) {
      return {
        path: fieldName,
        message: `Invalid enum definition: ${expectedType}`,
        expected: expectedType,
        actual: String(value),
      };
    }

    if (!validateEnum(value, enumValues)) {
      return {
        path: fieldName,
        message: `Value '${value}' not in enum`,
        expected: enumValues.join('|'),
        actual: String(value),
      };
    }

    return null;
  }

  // For now, accept other types
  return null;
}

/**
 * Validate array of data against schema
 */
export function validateArrayAgainstSchema(data: any[], schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];

  data.forEach((item, index) => {
    const result = validateAgainstSchema(item, schema);
    if (!result.valid && result.errors) {
      result.errors.forEach((error) => {
        errors.push({
          ...error,
          path: `[${index}].${error.path}`,
        });
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
