/**
 * Core type definitions for AXON
 */

/**
 * AXON encoding modes
 */
export type AXONMode = 'auto' | 'compact' | 'nested' | 'columnar' | 'stream' | 'sparse' | 'json';

/**
 * Delimiter options for compact mode
 */
export type Delimiter = ',' | '|' | '\t';

/**
 * Encoding options
 */
export interface EncodeOptions {
  /** Output mode (default: 'auto') */
  mode?: AXONMode;
  /** Indentation spaces (default: 2) */
  indent?: number;
  /** Delimiter for compact mode (default: '|') */
  delimiter?: Delimiter;
  /** Enable compression directives (default: false) */
  compression?: boolean;
  /** Include token statistics (default: false) */
  stats?: boolean;
  /** Predefined schemas */
  schemas?: Schema[];
}

/**
 * Decoding options
 */
export interface DecodeOptions {
  /** Expected indentation (default: 2) */
  indent?: number;
  /** Strict validation (default: true) */
  strict?: boolean;
  /** Required schemas for validation */
  schemas?: Schema[];
}

/**
 * Schema field definition
 */
export interface Field {
  /** Field name */
  name: string;
  /** Field type */
  type: string;
  /** Is field optional? */
  optional?: boolean | undefined;
  /** Compression directive */
  compression?: string | undefined;
}

/**
 * Schema definition
 */
export interface Schema {
  /** Schema name */
  name: string;
  /** Schema fields */
  fields: Field[];
  /** Parent schema name (for inheritance) */
  extends?: string | undefined;
  /** Query hints */
  hints?: string[] | undefined;
}

/**
 * Token statistics
 */
export interface TokenStats {
  /** AXON token count */
  axon_tokens: number;
  /** JSON (pretty) token count */
  json_tokens: number;
  /** JSON (compact) token count */
  json_compact_tokens: number;
  /** Reduction vs JSON (pretty) */
  reduction_vs_json: number;
  /** Reduction vs JSON (compact) */
  reduction_vs_json_compact: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid? */
  valid: boolean;
  /** Validation errors (if any) */
  errors?: Array<{
    path: string;
    message: string;
    expected?: string | undefined;
    actual?: string | undefined;
  }> | undefined;
}

/**
 * AST Node types
 */
export type ASTNode =
  | ObjectNode
  | ArrayNode
  | PrimitiveNode
  | SchemaBlockNode
  | EnumBlockNode
  | DictBlockNode;

/**
 * Object node in AST
 */
export interface ObjectNode {
  type: 'object';
  fields: Map<string, ASTNode>;
}

/**
 * Array node in AST
 */
export interface ArrayNode {
  type: 'array';
  name?: string | undefined;
  count: number;
  mode?: string | undefined;
  itemType?: string | undefined;
  items: ASTNode[];
  hints?: Map<string, string> | undefined;
  /** Decompressed column data from compression directives */
  compressionData?: Map<string, any[]> | undefined;
}

/**
 * Primitive node in AST
 */
export interface PrimitiveNode {
  type: 'primitive';
  valueType: PrimitiveType;
  value: PrimitiveValue;
}

/**
 * Schema block node
 */
export interface SchemaBlockNode {
  type: 'schema-block';
  schemas: Map<string, Schema>;
}

/**
 * Enum block node
 */
export interface EnumBlockNode {
  type: 'enum-block';
  enums: Map<string, string[]>;
}

/**
 * Dictionary block node
 */
export interface DictBlockNode {
  type: 'dict-block';
  dicts: Map<string, string[]>;
}

/**
 * Primitive types
 */
export type PrimitiveType =
  | 'i8'
  | 'i16'
  | 'i32'
  | 'i64'
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'f32'
  | 'f64'
  | 'str'
  | 'bool'
  | 'null'
  | 'date'
  | 'time'
  | 'iso8601'
  | 'uuid'
  | 'uuid-short'
  | 'bytes';

/**
 * Primitive values
 */
export type PrimitiveValue = string | number | boolean | null | Date;

/**
 * Token type for lexer
 */
export enum TokenType {
  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Punctuation
  COLON = 'COLON', // :
  DOUBLE_COLON = 'DOUBLE_COLON', // ::
  PIPE = 'PIPE', // |
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .

  // Brackets
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )

  // Special
  AT = 'AT', // @
  BANG = 'BANG', // !
  QUESTION = 'QUESTION', // ?
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  EQUALS = 'EQUALS', // =
  ASTERISK = 'ASTERISK', // *
  TILDE = 'TILDE', // ~

  // Whitespace
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',

  // End of file
  EOF = 'EOF',

  // Comments
  COMMENT = 'COMMENT',
}

/**
 * Token
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
