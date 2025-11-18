/**
 * Reference type parsing and validation
 * Supports: ref(table_name) for foreign key references
 */

/**
 * Parse reference type definition
 * Format: ref(table_name)
 */
export function parseReferenceDefinition(typeStr: string): string | null {
  const refPattern = /^ref\(([^)]+)\)$/;
  const match = typeStr.match(refPattern);

  if (!match) {
    return null;
  }

  const tableName = match[1]!.trim();

  if (tableName.length === 0) {
    return null;
  }

  return tableName;
}

/**
 * Check if a type string is a reference type
 */
export function isReferenceType(typeStr: string): boolean {
  return /^ref\([^)]+\)$/.test(typeStr);
}

/**
 * Create reference type string
 */
export function createReference(tableName: string): string {
  return `ref(${tableName})`;
}

/**
 * Reference metadata for validation
 */
export interface ReferenceMetadata {
  targetTable: string;
  value: any;
}

/**
 * Extract reference metadata from value
 */
export function createReferenceMetadata(targetTable: string, value: any): ReferenceMetadata {
  return {
    targetTable,
    value,
  };
}
