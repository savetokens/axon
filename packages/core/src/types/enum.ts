/**
 * Enum type validation and parsing
 * Supports: inline enums and global enum blocks
 */

/**
 * Parse enum type definition
 * Format: enum(value1,value2,value3)
 */
export function parseEnumDefinition(typeStr: string): string[] | null {
  const enumPattern = /^enum\(([^)]+)\)$/;
  const match = typeStr.match(enumPattern);

  if (!match) {
    return null;
  }

  const valuesStr = match[1]!;
  const values = valuesStr.split(',').map((v) => v.trim());

  // Validate all values are non-empty
  if (values.some((v) => v.length === 0)) {
    return null;
  }

  return values;
}

/**
 * Validate a value against enum values
 */
export function validateEnum(value: any, allowedValues: string[]): boolean {
  return allowedValues.includes(String(value));
}

/**
 * Check if a type string is an enum type
 */
export function isEnumType(typeStr: string): boolean {
  return /^enum\([^)]+\)$/.test(typeStr);
}

/**
 * Global enum registry
 */
export class EnumRegistry {
  private enums: Map<string, string[]> = new Map();

  /**
   * Register a global enum
   */
  register(name: string, values: string[]): void {
    this.enums.set(name, values);
  }

  /**
   * Get enum values by name
   */
  get(name: string): string[] | undefined {
    return this.enums.get(name);
  }

  /**
   * Check if enum exists
   */
  has(name: string): boolean {
    return this.enums.has(name);
  }

  /**
   * Validate value against named enum
   */
  validate(name: string, value: any): boolean {
    const values = this.get(name);
    if (!values) {
      return false;
    }
    return validateEnum(value, values);
  }

  /**
   * Clear all enums
   */
  clear(): void {
    this.enums.clear();
  }

  /**
   * Get all enum names
   */
  names(): string[] {
    return Array.from(this.enums.keys());
  }
}

// Global instance
export const globalEnums = new EnumRegistry();
