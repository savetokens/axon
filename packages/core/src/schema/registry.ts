import type { Schema, Field } from '../types';
import { AXONSchemaError } from '../utils/errors';

/**
 * Schema Registry for storing and managing schemas
 */
export class SchemaRegistry {
  private schemas: Map<string, Schema> = new Map();

  /**
   * Register a schema
   */
  register(schema: Schema): void {
    // Validate schema
    if (!schema.name || schema.name.length === 0) {
      throw new AXONSchemaError('', 'Schema name cannot be empty');
    }

    if (!schema.fields || schema.fields.length === 0) {
      throw new AXONSchemaError(schema.name, 'Schema must have at least one field');
    }

    // Validate field names are unique
    const fieldNames = new Set<string>();
    for (const field of schema.fields) {
      if (fieldNames.has(field.name)) {
        throw new AXONSchemaError(schema.name, `Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);
    }

    this.schemas.set(schema.name, schema);
  }

  /**
   * Get schema by name
   */
  get(name: string): Schema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Check if schema exists
   */
  has(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get all schema names
   */
  names(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Clear all schemas
   */
  clear(): void {
    this.schemas.clear();
  }

  /**
   * Delete a schema
   */
  delete(name: string): boolean {
    return this.schemas.delete(name);
  }

  /**
   * Get resolved schema (with inheritance)
   */
  getResolved(name: string): Schema | undefined {
    const schema = this.get(name);
    if (!schema) {
      return undefined;
    }

    // If no inheritance, return as-is
    if (!schema.extends) {
      return schema;
    }

    // Resolve parent
    const parent = this.getResolved(schema.extends);
    if (!parent) {
      throw new AXONSchemaError(name, `Parent schema not found: ${schema.extends}`);
    }

    // Merge fields (parent first, then child)
    const resolvedFields: Field[] = [...parent.fields, ...schema.fields];

    return {
      name: schema.name,
      fields: resolvedFields,
      hints: schema.hints,
      // Don't include extends in resolved schema
    };
  }
}

// Global schema registry
export const globalSchemas = new SchemaRegistry();

/**
 * Register a schema globally
 */
export function registerSchema(schema: Schema): void {
  globalSchemas.register(schema);
}

/**
 * Get a schema globally
 */
export function getSchema(name: string): Schema | undefined {
  return globalSchemas.get(name);
}

/**
 * List all registered schemas
 */
export function listSchemas(): Schema[] {
  return globalSchemas.names().map((name) => globalSchemas.get(name)!);
}
