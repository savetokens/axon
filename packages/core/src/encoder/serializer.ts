import type { EncodeOptions } from '../types';
import { analyzeData, inferType } from './analyzer';

/**
 * Serialize JavaScript value to AXON string
 */
export class Serializer {
  private indent: number;
  private delimiter: string;

  constructor(private _options: EncodeOptions = {}) {
    this.indent = _options.indent ?? 2;
    this.delimiter = _options.delimiter ?? '|';
  }

  /**
   * Serialize value to AXON
   */
  public serialize(value: any, name?: string): string {
    // Analyze if array
    if (Array.isArray(value)) {
      const analysis = analyzeData(value);

      // Uniform array of objects -> compact mode
      if (analysis.isUniform && analysis.fields) {
        return this.serializeCompactArray(value, analysis.fields, name);
      }

      // Non-uniform array -> inline array
      return this.serializeInlineArray(value, name);
    }

    // Object - check if it's a simple wrapper with one array field
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);

      // Single field that is an array - serialize without wrapper
      if (keys.length === 1 && Array.isArray(value[keys[0]!])) {
        const fieldName = keys[0]!;
        const arrayValue = value[fieldName];
        return this.serialize(arrayValue, fieldName);
      }

      return this.serializeObject(value, name);
    }

    // Primitive
    return this.serializePrimitive(value);
  }

  /**
   * Serialize compact mode array
   */
  private serializeCompactArray(items: any[], fields: string[], name?: string): string {
    const lines: string[] = [];

    // Header: name::[count] field1:type|field2:type|...
    const count = items.length;
    const fieldDefs = fields.map((field) => {
      const type = inferType(items[0]?.[field]);
      return `${field}:${type}`;
    });

    const header = name
      ? `${name}::[${count}] ${fieldDefs.join(this.delimiter)}`
      : `::[${count}] ${fieldDefs.join(this.delimiter)}`;

    lines.push(header);

    // Data rows
    for (const item of items) {
      const values = fields.map((field) => this.formatValue(item[field]));
      lines.push(`  ${values.join(this.delimiter)}`);
    }

    return lines.join('\n');
  }

  /**
   * Serialize inline array
   */
  private serializeInlineArray(items: any[], name?: string): string {
    const count = items.length;
    const values = items.map((item) => this.formatValue(item)).join(', ');

    if (name) {
      return `${name}::[${count}]: ${values}`;
    }
    return `[${count}]: ${values}`;
  }

  /**
   * Serialize object
   */
  private serializeObject(obj: Record<string, any>, name?: string, level: number = 0): string {
    const lines: string[] = [];
    const indentStr = ' '.repeat(level * this.indent);

    if (name) {
      lines.push(`${indentStr}${name}: {`);
    } else {
      lines.push(`${indentStr}{`);
    }

    for (const [key, value] of Object.entries(obj)) {
      const valueIndent = ' '.repeat((level + 1) * this.indent);

      if (Array.isArray(value)) {
        // Nested array - use inline format with count
        const count = value.length;
        const values = value.map(v => this.formatValue(v)).join(', ');
        lines.push(`${valueIndent}${key}: [${count}]: ${values}`);
      } else if (typeof value === 'object' && value !== null) {
        // Nested object
        const nested = this.serializeObject(value, key, level + 1);
        lines.push(nested);
      } else {
        // Primitive
        const type = inferType(value);
        lines.push(`${valueIndent}${key}:${type}: ${this.formatValue(value)}`);
      }
    }

    lines.push(`${indentStr}}`);

    return lines.join('\n');
  }

  /**
   * Format a value for output
   */
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();

    if (typeof value === 'string') {
      // Check if needs quoting
      if (this.needsQuoting(value)) {
        return `"${this.escapeString(value)}"`;
      }
      return value;
    }

    if (Array.isArray(value)) {
      return `[${value.map((v) => this.formatValue(v)).join(', ')}]`;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Check if string needs quoting
   */
  private needsQuoting(str: string): boolean {
    // Empty string
    if (str.length === 0) return true;

    // Contains spaces
    if (/\s/.test(str)) return true;

    // Contains delimiter
    if (str.includes(this.delimiter)) return true;

    // Contains special chars that need escaping
    if (/[",\\]/.test(str)) return true;

    // Looks like boolean/null
    if (str === 'true' || str === 'false' || str === 'null') return true;

    // Looks like number
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(str)) return true;

    return false;
  }

  /**
   * Escape string for AXON
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');
  }

  /**
   * Serialize primitive value
   */
  private serializePrimitive(value: any): string {
    return this.formatValue(value);
  }
}

/**
 * Serialize JavaScript value to AXON string
 */
export function serialize(value: any, options?: EncodeOptions): string {
  const serializer = new Serializer(options);
  return serializer.serialize(value);
}
