import type { EncodeOptions } from '../types';
import { analyzeData, inferType, inferTypeForField } from './analyzer';
import { selectMode } from './mode-selector';
import { encodeColumnar } from './modes/columnar';
import { encodeStream } from './modes/stream';
import { encodeSparse } from './modes/sparse';
import {
  analyzeCompression,
  encodeRLE,
  encodeDelta,
  encodeDictionary,
  type CompressionRecommendation,
} from './compression-analyzer';
import { AXONError } from '../utils/errors';

/** Maximum nesting depth allowed */
const MAX_DEPTH = 100;

/**
 * Serialize JavaScript value to AXON string
 */
export class Serializer {
  private indent: number;
  private delimiter: string;
  /** Stack of objects currently being serialized (for circular detection) */
  private serializationStack: WeakSet<object> = new WeakSet();

  constructor(private _options: EncodeOptions = {}) {
    this.indent = _options.indent ?? 2;
    this.delimiter = _options.delimiter ?? '|';
  }

  /**
   * Check for circular reference (object in current serialization path)
   */
  private enterObject(value: object): void {
    if (this.serializationStack.has(value)) {
      throw new AXONError('Circular reference detected');
    }
    this.serializationStack.add(value);
  }

  /**
   * Leave object (done serializing, allow it to appear elsewhere)
   */
  private leaveObject(value: object): void {
    this.serializationStack.delete(value);
  }

  /**
   * Check depth limit
   */
  private checkDepth(depth: number): void {
    if (depth > MAX_DEPTH) {
      throw new AXONError(`Maximum nesting depth exceeded (${MAX_DEPTH})`);
    }
  }

  /**
   * Serialize value to AXON
   */
  public serialize(value: any, name?: string): string {
    // Reset stack for each top-level serialize call
    this.serializationStack = new WeakSet();

    // Select mode based on data characteristics
    const mode = selectMode(value, { mode: this._options.mode });

    // Route to appropriate serializer based on mode
    switch (mode) {
      case 'columnar':
        return this.serializeColumnar(value, name);
      case 'stream':
        return this.serializeStream(value, name);
      case 'sparse':
        return this.serializeSparse(value, name);
      case 'json':
        return JSON.stringify(value, null, this.indent);
      case 'compact':
      case 'nested':
      default:
        // Default behavior - analyze and route
        return this.serializeDefault(value, name, 0);
    }
  }

  /**
   * Default serialization logic (compact/nested)
   */
  private serializeDefault(value: any, name?: string, depth: number = 0): string {
    // Check depth limit
    this.checkDepth(depth);

    // Analyze if array
    if (Array.isArray(value)) {
      const analysis = analyzeData(value);

      // Uniform array of objects -> compact mode
      if (analysis.isUniform && analysis.fields) {
        return this.serializeCompactArray(value, analysis.fields, name);
      }

      // Non-uniform array -> inline array
      return this.serializeInlineArray(value, name, depth);
    }

    // Object - check if it's a simple wrapper with one array field
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);

      // Single field that is an array - serialize without wrapper
      if (keys.length === 1 && Array.isArray(value[keys[0]!])) {
        const fieldName = keys[0]!;
        const arrayValue = value[fieldName];
        return this.serializeDefault(arrayValue, fieldName, depth + 1);
      }

      return this.serializeObject(value, name, depth);
    }

    // Primitive
    return this.serializePrimitive(value);
  }

  /**
   * Serialize using columnar mode
   */
  private serializeColumnar(value: any, name?: string): string {
    if (!Array.isArray(value)) {
      return this.serializeDefault(value, name);
    }
    return encodeColumnar(value, name, 0);
  }

  /**
   * Serialize using stream mode
   */
  private serializeStream(value: any, name?: string): string {
    if (!Array.isArray(value)) {
      return this.serializeDefault(value, name);
    }
    return encodeStream(value, name);
  }

  /**
   * Serialize using sparse mode
   */
  private serializeSparse(value: any, name?: string): string {
    if (!Array.isArray(value) || value.length === 0) {
      return this.serializeDefault(value, name);
    }
    const fields = Object.keys(value[0] || {});
    return encodeSparse(value, fields, name);
  }

  /**
   * Serialize compact mode array
   */
  private serializeCompactArray(items: any[], fields: string[], name?: string): string {
    // Analyze compression if enabled
    let compressionMap: Map<string, CompressionRecommendation> = new Map();
    if (this._options.compression && items.length >= 10) {
      const recommendations = analyzeCompression(items);
      for (const rec of recommendations) {
        compressionMap.set(rec.field, rec);
      }
    }

    const lines: string[] = [];

    // Header: name::[count] field1:type@compression|field2:type|...
    const count = items.length;
    const fieldDefs = fields.map((field) => {
      // Use inferTypeForField to check ALL items for widest type
      const type = inferTypeForField(items, field);
      const compression = compressionMap.get(field);
      if (compression && compression.algorithm !== 'none') {
        return `${field}:${type}@${compression.algorithm}`;
      }
      return `${field}:${type}`;
    });

    const header = name
      ? `${name}::[${count}] ${fieldDefs.join(this.delimiter)}`
      : `::[${count}] ${fieldDefs.join(this.delimiter)}`;

    lines.push(header);

    // Output compression directives if any
    const compressedFields = new Set<string>();
    for (const [field, rec] of compressionMap) {
      const values = items.map((item) => item[field]);

      if (rec.algorithm === 'dictionary') {
        const { dict, indices } = encodeDictionary(values.map(String));
        lines.push(`@dict:${field} [${dict.join(', ')}]`);
        lines.push(`@idx:${field} ${indices.join(',')}`);
        compressedFields.add(field);
      } else if (rec.algorithm === 'rle') {
        const encoded = encodeRLE(values);
        lines.push(`@rle:${field} ${encoded}`);
        compressedFields.add(field);
      } else if (rec.algorithm === 'delta') {
        const numericValues = values.filter((v) => typeof v === 'number') as number[];
        if (numericValues.length === values.length) {
          const encoded = encodeDelta(numericValues);
          lines.push(`@delta:${field} ${encoded}`);
          compressedFields.add(field);
        }
      }
    }

    // If all fields are compressed, skip row data
    if (compressedFields.size === fields.length) {
      return lines.join('\n');
    }

    // Data rows (only for non-compressed fields or when not all compressed)
    for (const item of items) {
      const values = fields.map((field) => {
        if (compressedFields.has(field)) {
          return '~'; // Placeholder for compressed field
        }
        return this.formatValue(item[field]);
      });
      lines.push(`  ${values.join(this.delimiter)}`);
    }

    return lines.join('\n');
  }

  /**
   * Serialize inline array
   */
  private serializeInlineArray(items: any[], name?: string, depth: number = 0): string {
    this.checkDepth(depth);

    const count = items.length;
    const values = items.map((item) => {
      return this.formatValue(item, depth + 1);
    }).join(', ');

    if (name) {
      return `${name}::[${count}]: ${values}`;
    }
    return `[${count}]: ${values}`;
  }

  /**
   * Serialize object
   */
  private serializeObject(obj: Record<string, any>, name?: string, level: number = 0): string {
    // Check depth limit
    this.checkDepth(level);

    // Enter this object for circular detection
    this.enterObject(obj);

    try {
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
          const values = value.map(v => this.formatValue(v, level + 1)).join(', ');
          lines.push(`${valueIndent}${key}: [${count}]: ${values}`);
        } else if (typeof value === 'object' && value !== null) {
          // Nested object - will check circular inside serializeObject
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
    } finally {
      // Leave this object to allow it to appear elsewhere
      this.leaveObject(obj);
    }
  }

  /**
   * Format a value for output
   */
  private formatValue(value: any, depth: number = 0): string {
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
      this.checkDepth(depth);
      return `[${value.map((v) => this.formatValue(v, depth + 1)).join(', ')}]`;
    }

    if (typeof value === 'object') {
      this.checkDepth(depth);
      // JSON.stringify has its own circular reference detection
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
