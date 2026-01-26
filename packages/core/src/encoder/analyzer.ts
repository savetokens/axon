/**
 * Analyze data structure to determine optimal encoding mode
 */

export interface DataAnalysis {
  /** Is the data an array? */
  isArray: boolean;
  /** Is it an array of objects? */
  isArrayOfObjects: boolean;
  /** Are all objects uniform (same fields)? */
  isUniform: boolean;
  /** Field names (if uniform) */
  fields?: string[] | undefined;
  /** Array length */
  length?: number | undefined;
  /** Inferred types for each field */
  types?: Map<string, string> | undefined;
}

/**
 * Analyze data structure
 */
export function analyzeData(data: any): DataAnalysis {
  // Check if array
  if (!Array.isArray(data)) {
    return {
      isArray: false,
      isArrayOfObjects: false,
      isUniform: false,
    };
  }

  const length = data.length;

  // Empty array
  if (length === 0) {
    return {
      isArray: true,
      isArrayOfObjects: false,
      isUniform: false,
      length: 0,
    };
  }

  // Check if array of objects
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null || Array.isArray(firstItem)) {
    return {
      isArray: true,
      isArrayOfObjects: false,
      isUniform: false,
      length,
    };
  }

  // Get fields from first object - preserve insertion order
  const firstFields = Object.keys(firstItem);
  const firstFieldSet = new Set(firstFields);

  // Check uniformity - use Set comparison to ignore order
  let isUniform = true;
  for (let i = 1; i < length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      isUniform = false;
      break;
    }

    const itemFields = Object.keys(item);
    if (itemFields.length !== firstFields.length) {
      isUniform = false;
      break;
    }

    // Check that all fields exist (order doesn't matter for uniformity)
    for (const field of itemFields) {
      if (!firstFieldSet.has(field)) {
        isUniform = false;
        break;
      }
    }

    if (!isUniform) break;
  }

  // Infer types if uniform - check ALL items for widest type
  let types: Map<string, string> | undefined;
  if (isUniform) {
    types = new Map();
    for (const field of firstFields) {
      // Use inferTypeForField to check all values, not just the first
      types.set(field, inferTypeForField(data, field));
    }
  }

  return {
    isArray: true,
    isArrayOfObjects: true,
    isUniform,
    fields: isUniform ? firstFields : undefined,
    length,
    types,
  };
}

/**
 * Infer AXON type from JavaScript value
 */
export function inferType(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'string') return 'str';

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      // Choose appropriate integer type based on value
      if (value >= 0) {
        if (value <= 255) return 'u8';
        if (value <= 65535) return 'u16';
        if (value <= 4294967295) return 'u32';
        return 'u64';
      } else {
        if (value >= -128 && value <= 127) return 'i8';
        if (value >= -32768 && value <= 32767) return 'i16';
        if (value >= -2147483648 && value <= 2147483647) return 'i32';
        return 'i64';
      }
    } else {
      // Float
      return 'f32';
    }
  }

  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';

  return 'str'; // Fallback
}

/**
 * Type hierarchy for widening (smaller index = narrower type)
 */
const TYPE_HIERARCHY: Record<string, number> = {
  u8: 1,
  u16: 2,
  u32: 3,
  u64: 4,
  i8: 5,
  i16: 6,
  i32: 7,
  i64: 8,
  f32: 9,
  f64: 10,
};

/**
 * Widen type to accommodate both current and candidate types
 * Handles signed/unsigned mixing correctly
 */
export function widenType(current: string, candidate: string): string {
  // Same type - no change
  if (current === candidate) return current;

  // Non-numeric types don't widen
  if (!(current in TYPE_HIERARCHY) || !(candidate in TYPE_HIERARCHY)) {
    // If one is numeric and one isn't, fall back to string
    if (current in TYPE_HIERARCHY || candidate in TYPE_HIERARCHY) {
      return 'str';
    }
    return current;
  }

  // Handle float - any float makes result float
  if (current === 'f32' || current === 'f64' || candidate === 'f32' || candidate === 'f64') {
    return 'f64';
  }

  const currentIsSigned = current.startsWith('i');
  const candidateIsSigned = candidate.startsWith('i');

  // If mixing signed and unsigned, need signed type wide enough for both
  if (currentIsSigned !== candidateIsSigned) {
    // Get the bit widths
    const currentBits = parseInt(current.slice(1), 10);
    const candidateBits = parseInt(candidate.slice(1), 10);

    // Need a signed type that can hold the unsigned range
    // u8 + i8 -> i16, u16 + i16 -> i32, etc.
    const maxBits = Math.max(currentBits, candidateBits);
    if (maxBits <= 8) return 'i16';
    if (maxBits <= 16) return 'i32';
    if (maxBits <= 32) return 'i64';
    return 'i64';
  }

  // Same signedness - just take the wider type
  const currentRank = TYPE_HIERARCHY[current]!;
  const candidateRank = TYPE_HIERARCHY[candidate]!;
  return currentRank >= candidateRank ? current : candidate;
}

/**
 * Infer type for a field by examining all values
 * Returns the widest type that can safely hold all values
 */
export function inferTypeForField(items: any[], field: string): string {
  if (items.length === 0) return 'str';

  let resultType: string | null = null;

  for (const item of items) {
    const value = item[field];

    // Skip null/undefined - don't affect type inference
    if (value === null || value === undefined) {
      continue;
    }

    const valueType = inferType(value);

    if (resultType === null) {
      resultType = valueType;
    } else {
      resultType = widenType(resultType, valueType);
    }
  }

  return resultType ?? 'str';
}
