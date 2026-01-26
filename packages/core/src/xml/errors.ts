/**
 * XML-specific error classes for AXON
 */

import { AXONError } from '../utils/errors';

/**
 * Error thrown during XML parsing when syntax is invalid
 */
export class AXONXmlParseError extends AXONError {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly context?: string
  ) {
    super(`XML parse error at line ${line}, column ${column}: ${message}${context ? ` near "${context}"` : ''}`);
    this.name = 'AXONXmlParseError';
  }
}

/**
 * Error thrown during XML ↔ AXON conversion
 */
export class AXONXmlConversionError extends AXONError {
  constructor(
    message: string,
    public readonly path?: string,
    public readonly cause?: Error
  ) {
    super(`XML conversion error${path ? ` at ${path}` : ''}: ${message}`);
    this.name = 'AXONXmlConversionError';
  }
}

/**
 * Error thrown when XML structure is invalid or unsupported
 */
export class AXONXmlStructureError extends AXONError {
  constructor(
    message: string,
    public readonly elementName?: string
  ) {
    super(`XML structure error${elementName ? ` in <${elementName}>` : ''}: ${message}`);
    this.name = 'AXONXmlStructureError';
  }
}
