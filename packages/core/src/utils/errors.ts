/**
 * Base error class for all AXON-related errors
 */
export class AXONError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AXONError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown during parsing when syntax is invalid
 */
export class AXONParseError extends AXONError {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly token?: string
  ) {
    super(`Parse error at line ${line}, column ${column}: ${message}`);
    this.name = 'AXONParseError';
  }
}

/**
 * Error thrown when type validation fails
 */
export class AXONTypeError extends AXONError {
  constructor(
    public readonly path: string,
    public readonly expected: string,
    public readonly actual: string
  ) {
    super(`Type error at ${path}: expected ${expected}, got ${actual}`);
    this.name = 'AXONTypeError';
  }
}

/**
 * Error thrown when schema operations fail
 */
export class AXONSchemaError extends AXONError {
  constructor(public readonly schemaName: string, message: string) {
    super(`Schema error in '${schemaName}': ${message}`);
    this.name = 'AXONSchemaError';
  }
}

/**
 * Error thrown when validation fails
 */
export class AXONValidationError extends AXONError {
  constructor(public readonly errors: ValidationError[]) {
    super(`Validation failed with ${errors.length} error(s):\n${errors.map((e) => e.message).join('\n')}`);
    this.name = 'AXONValidationError';
  }
}

/**
 * Individual validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
  expected?: string | undefined;
  actual?: string | undefined;
}
