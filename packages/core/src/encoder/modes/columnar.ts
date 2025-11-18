/**
 * Columnar Mode Encoder
 * Organizes data by columns instead of rows
 * Best for: Large datasets (1000+ rows), numeric-heavy data, analytics
 */

import { inferType } from '../analyzer';

/**
 * Check if columnar mode should be used
 */
export function shouldUseColumnar(data: any[]): boolean {
  // Requires large dataset
  if (data.length < 100) {
    return false;
  }

  // Must be array of objects
  if (!data.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    return false;
  }

  // Check if uniform
  const firstKeys = Object.keys(data[0] || {}).sort();
  const isUniform = data.every((item) => {
    const keys = Object.keys(item).sort();
    return keys.length === firstKeys.length && keys.every((k, i) => k === firstKeys[i]);
  });

  if (!isUniform) {
    return false;
  }

  // Check if mostly numeric (columnar is best for analytics)
  let numericFields = 0;
  for (const key of firstKeys) {
    const values = data.map((item) => item[key]);
    if (values.every((v) => typeof v === 'number')) {
      numericFields++;
    }
  }

  // If >50% fields are numeric, use columnar
  return numericFields / firstKeys.length > 0.5;
}

/**
 * Encode data in columnar format
 */
export function encodeColumnar(data: any[], name?: string, indent: number = 0): string {
  if (data.length === 0) {
    return name ? `${name}::[0]@columnar:` : '::[0]@columnar:';
  }

  const fields = Object.keys(data[0]!).sort();
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  // Header
  const header = name ? `${name}::[${data.length}]@columnar {` : `::[${data.length}]@columnar {`;
  lines.push(indentStr + header);

  // Column data
  for (const field of fields) {
    const values = data.map((item) => item[field]);
    const type = inferType(values[0]);

    // Format column
    const valueStr = values.map((v) => formatValue(v)).join(', ');
    lines.push(indentStr + `  ${field}:${type}: [${valueStr}]`);
  }

  lines.push(indentStr + '}');

  return lines.join('\n');
}

/**
 * Format a value for columnar output
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Quote if contains comma or special chars
    if (value.includes(',') || value.includes(' ') || value === 'null' || value === 'true' || value === 'false') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Decode columnar format to array of objects
 */
export function decodeColumnar(columns: Map<string, any[]>): any[] {
  const fields = Array.from(columns.keys());

  if (fields.length === 0) {
    return [];
  }

  const length = columns.get(fields[0]!)?.length || 0;
  const result: any[] = [];

  for (let i = 0; i < length; i++) {
    const obj: Record<string, any> = {};

    for (const field of fields) {
      const columnData = columns.get(field);
      if (columnData && i < columnData.length) {
        obj[field] = columnData[i];
      }
    }

    result.push(obj);
  }

  return result;
}
