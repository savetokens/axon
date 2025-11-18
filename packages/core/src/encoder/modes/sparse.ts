/**
 * Sparse Mode Encoder
 * For data with many null/undefined/default values
 * Only outputs non-null values, omits nulls to save space
 * Best for: Data where >50% of fields are null
 */

/**
 * Check if sparse mode should be used
 */
export function shouldUseSparse(data: any[]): boolean {
  if (data.length < 20) {
    return false;
  }

  // Must be array of objects
  if (!data.every((item) => typeof item === 'object' && item !== null)) {
    return false;
  }

  // Count null/undefined values
  let totalFields = 0;
  let nullFields = 0;

  for (const item of data) {
    for (const value of Object.values(item)) {
      totalFields++;
      if (value === null || value === undefined) {
        nullFields++;
      }
    }
  }

  // If >50% fields are null, use sparse mode
  return nullFields / totalFields > 0.5;
}

/**
 * Encode data in sparse format
 * Format: Uses empty values for nulls (field1||field3 means field2 is null)
 */
export function encodeSparse(data: any[], fields: string[], name?: string): string {
  if (data.length === 0) {
    return name ? `${name}::[0]@sparse:` : '::[0]@sparse:';
  }

  const lines: string[] = [];

  // Mark optional fields
  const fieldDefs = fields.map((f) => {
    const hasNull = data.some((item) => item[f] === null || item[f] === undefined);
    return hasNull ? `${f}?` : f;
  });

  // Header
  const header = name
    ? `${name}::[${data.length}]@sparse ${fieldDefs.join('|')}`
    : `::[${data.length}]@sparse ${fieldDefs.join('|')}`;

  lines.push(header);

  // Data rows - omit nulls
  for (const item of data) {
    const values = fields.map((f) => {
      const value = item[f];
      if (value === null || value === undefined) {
        return ''; // Empty for null
      }
      return formatValue(value);
    });

    lines.push(`  ${values.join('|')}`);
  }

  return lines.join('\n');
}

/**
 * Format value for sparse output
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    if (value.includes('|') || value.includes(' ') || value.length === 0) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Calculate sparsity ratio
 */
export function getSparsityRatio(data: any[]): number {
  let totalFields = 0;
  let nullFields = 0;

  for (const item of data) {
    for (const value of Object.values(item)) {
      totalFields++;
      if (value === null || value === undefined) {
        nullFields++;
      }
    }
  }

  return nullFields / totalFields;
}
