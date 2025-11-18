/**
 * Stream Mode Encoder
 * For sequential time-series data with delta encoding
 * Best for: Time-series, sequential data with temporal ordering
 * Format: timestamp >> values, +delta >> delta_values, ...
 */

/**
 * Check if stream mode should be used
 */
export function shouldUseStream(data: any[]): boolean {
  if (data.length < 50) {
    return false;
  }

  // Must be array of objects
  if (!data.every((item) => typeof item === 'object' && item !== null)) {
    return false;
  }

  // Check for timestamp field
  const firstItem = data[0] || {};
  const hasTimestamp = Object.keys(firstItem).some((key) =>
    key.toLowerCase().includes('time') ||
    key.toLowerCase().includes('date') ||
    key === 'ts' ||
    key === 'timestamp' ||
    key === 'created' ||
    key === 'updated'
  );

  return hasTimestamp;
}

/**
 * Encode data in stream format
 * Note: Simplified version for Phase 3
 */
export function encodeStream(data: any[], name?: string): string {
  if (data.length === 0) {
    return name ? `${name}::[0]@stream:` : '::[0]@stream:';
  }

  // For Phase 3, use a simplified stream format
  // Full >> syntax will be implemented when integrating with encoder
  const fields = Object.keys(data[0]!);
  const lines: string[] = [];

  // Header
  const header = name
    ? `${name}::[${data.length}]@stream ${fields.join('|')}`
    : `::[${data.length}]@stream ${fields.join('|')}`;

  lines.push(header);

  // Data rows (simplified - full delta in future)
  for (const item of data) {
    const values = fields.map((f) => formatValue(item[f]));
    lines.push(`  ${values.join('|')}`);
  }

  return lines.join('\n');
}

/**
 * Format value for stream output
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    if (value.includes('|') || value.includes(' ')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}
