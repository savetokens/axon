/**
 * AXON - Adaptive eXchange Oriented Notation
 * Core encoder/decoder library
 */

// Types
export type {
  AXONMode,
  Delimiter,
  EncodeOptions,
  DecodeOptions,
  Field,
  Schema,
  TokenStats,
  ValidationResult,
  ASTNode,
  ObjectNode,
  ArrayNode,
  PrimitiveNode,
  SchemaBlockNode,
  EnumBlockNode,
  DictBlockNode,
  PrimitiveType,
  PrimitiveValue,
  Token,
} from './types';

export { TokenType } from './types';

// Errors
export {
  AXONError,
  AXONParseError,
  AXONTypeError,
  AXONSchemaError,
  AXONValidationError,
} from './utils/errors';

export type { ValidationError } from './utils/errors';

// Lexer
export { Lexer, tokenize } from './decoder/lexer';

// Parser
export { Parser, parse } from './decoder/parser';

// Object Builder
export { ObjectBuilder, buildObject } from './decoder/builder';

// Encoder/Decoder
export { encode } from './encoder';
export { decode } from './decoder';

// Type Utilities
export * from './types/temporal';
export * from './types/uuid';
export * from './types/enum';
export * from './types/reference';

// Schema System
export * from './schema/registry';
export * from './schema/validator';

// Compression
export * from './compression/rle';
export * from './compression/dictionary';
export * from './compression/delta';
export * from './compression/bits';
export * from './compression/varint';

// Modes (Phase 3)
export * from './encoder/modes/columnar';
export * from './encoder/modes/stream';
export * from './encoder/modes/sparse';

// Mode Selection (Phase 3)
export * from './encoder/mode-selector';

// Query Hints (Phase 3)
export * from './encoder/query-hints';

// Summary Statistics (Phase 3)
export * from './encoder/summary-stats';

// XML Support (Phase 4)
export * from './xml';
