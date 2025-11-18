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

  // Get fields from first object
  const firstFields = Object.keys(firstItem).sort();

  // Check uniformity
  let isUniform = true;
  for (let i = 1; i < length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      isUniform = false;
      break;
    }

    const itemFields = Object.keys(item).sort();
    if (itemFields.length !== firstFields.length) {
      isUniform = false;
      break;
    }

    for (let j = 0; j < firstFields.length; j++) {
      if (itemFields[j] !== firstFields[j]) {
        isUniform = false;
        break;
      }
    }

    if (!isUniform) break;
  }

  // Infer types if uniform
  let types: Map<string, string> | undefined;
  if (isUniform) {
    types = new Map();
    for (const field of firstFields) {
      const value = firstItem[field];
      types.set(field, inferType(value));
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
