import type { Token, ASTNode, ObjectNode, ArrayNode, PrimitiveNode } from '../types';
import { TokenType } from '../types';
import { AXONParseError } from '../utils/errors';
import { decompressRLE, decompressDelta, parseDictionary, parseIndices, decompressDictionary } from './decompressor';

/**
 * Parser for building AST from tokens
 */
export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    // Filter out comments
    this.tokens = tokens.filter((t) => t.type !== TokenType.COMMENT);
  }

  /**
   * Parse tokens into AST
   */
  public parse(): ASTNode {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      throw new AXONParseError('Empty input', 1, 1);
    }

    // Check for named value at root (e.g., user: {...} or users::[3] ...)
    if (this.check(TokenType.IDENTIFIER)) {
      const nextToken = this.peekAhead(1);

      // Named array: users::[3] ...
      if (nextToken?.type === TokenType.DOUBLE_COLON) {
        const arrayNode = this.parseArray();

        // Wrap in object if it has a name
        if (arrayNode.name) {
          const fields = new Map<string, ASTNode>();
          fields.set(arrayNode.name, {
            type: 'array',
            name: undefined,
            count: arrayNode.count,
            items: arrayNode.items,
          });
          return {
            type: 'object',
            fields,
          };
        }

        return arrayNode;
      }

      // Named value: user: {...} or name: value
      if (nextToken?.type === TokenType.COLON) {
        const fieldName = this.advance().value;
        this.advance(); // consume colon
        this.skipWhitespace();

        const fieldValue = this.parseValue();

        // Wrap in object
        const fields = new Map<string, ASTNode>();
        fields.set(fieldName, fieldValue);
        return {
          type: 'object',
          fields,
        };
      }
    }

    // Check for root-level inline array [count]: values
    if (this.check(TokenType.LBRACKET)) {
      return this.parseInlineArray();
    }

    // Check for root-level compact array ::[count] fields
    if (this.check(TokenType.DOUBLE_COLON)) {
      return this.parseArray();
    }

    // Parse as object or value
    return this.parseValue();
  }

  /**
   * Parse a value (can be object, array, or primitive)
   */
  private parseValue(): ASTNode {
    this.skipWhitespace();

    // Object
    if (this.check(TokenType.LBRACE)) {
      return this.parseObject();
    }

    // Array (inline or compact)
    if (this.check(TokenType.LBRACKET)) {
      return this.parseInlineArray();
    }

    // Primitive
    return this.parsePrimitive();
  }

  /**
   * Parse object
   */
  private parseObject(): ObjectNode {
    const fields = new Map<string, ASTNode>();

    this.consume(TokenType.LBRACE, 'Expected "{"');
    this.skipWhitespace();

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipWhitespace();

      // Parse field name
      const name = this.consume(TokenType.IDENTIFIER, 'Expected field name');
      this.skipWhitespace();

      this.consume(TokenType.COLON, 'Expected ":" after field name');
      this.skipWhitespace();

      // Check for compact array (e.g., tags::[2] ...)
      if (this.check(TokenType.COLON)) {
        this.advance(); // second colon (making ::)
        this.skipWhitespace();

        // Parse as compact array
        const arrayNode = this.parseArrayBody(name.value);
        fields.set(name.value, {
          type: 'array',
          name: undefined,
          count: arrayNode.count,
          items: arrayNode.items,
        });
      } else {
        // Check for type annotation (e.g., id:i32: 123)
        if (this.check(TokenType.IDENTIFIER) && this.peekAhead(1)?.type === TokenType.COLON) {
          // Skip the type annotation
          this.advance(); // type name
          this.advance(); // colon
          this.skipWhitespace();
        }

        // Parse field value
        const value = this.parseValue();
        fields.set(name.value, value);
      }

      this.skipWhitespace();

      // Optional comma or newline
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipWhitespace();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');

    return {
      type: 'object',
      fields,
    };
  }

  /**
   * Parse compact mode array
   * Format: name::[count] field1:type|field2:type|...
   */
  private parseArray(): ArrayNode {
    let name: string | undefined;

    // Optional name
    if (this.check(TokenType.IDENTIFIER)) {
      const nameToken = this.advance();
      name = nameToken.value;
    }

    this.consume(TokenType.DOUBLE_COLON, 'Expected "::"');

    return this.parseArrayBody(name);
  }

  /**
   * Parse array body (count, fields, data)
   * Used by both parseArray() and object field parsing
   */
  private parseArrayBody(name?: string): ArrayNode {
    this.consume(TokenType.LBRACKET, 'Expected "["');

    const countToken = this.consume(TokenType.NUMBER, 'Expected array count');
    const count = parseInt(countToken.value, 10);

    this.consume(TokenType.RBRACKET, 'Expected "]"');
    this.skipWhitespace();

    // Parse field definitions (compact mode)
    const fieldDefs: string[] = [];
    const fieldTypes: string[] = [];
    const fieldCompression: Map<string, string> = new Map();

    // Parse first field
    if (this.check(TokenType.IDENTIFIER)) {
      const { fieldName, fieldType, compression } = this.parseFieldDef();
      fieldDefs.push(fieldName);
      fieldTypes.push(fieldType);
      if (compression) fieldCompression.set(fieldName, compression);

      // Parse remaining fields
      while (this.check(TokenType.PIPE)) {
        this.advance();
        const { fieldName, fieldType, compression } = this.parseFieldDef();
        fieldDefs.push(fieldName);
        fieldTypes.push(fieldType);
        if (compression) fieldCompression.set(fieldName, compression);
      }
    }

    this.skipWhitespace();

    // Check for optional colon before data
    if (this.check(TokenType.COLON)) {
      this.advance();
      this.skipWhitespace();
    }

    // Parse compression directives (@rle:field, @dict:field, etc.)
    const compressionData = new Map<string, any[]>();
    const dictionaries = new Map<string, string[]>();

    while (this.check(TokenType.AT)) {
      const directive = this.parseCompressionDirective();
      if (!directive) break;

      const { type, field, data } = directive;

      if (type === 'dict') {
        // Store dictionary for later use with @idx
        dictionaries.set(field, parseDictionary(data));
      } else if (type === 'idx') {
        // Apply dictionary to indices
        const dict = dictionaries.get(field);
        if (dict) {
          const indices = parseIndices(data);
          compressionData.set(field, decompressDictionary(dict, indices));
        }
      } else if (type === 'rle') {
        compressionData.set(field, decompressRLE(data));
      } else if (type === 'delta') {
        compressionData.set(field, decompressDelta(data));
      }

      this.skipWhitespace();
    }

    // Check if all fields are compressed (skip row data)
    const allFieldsCompressed = fieldDefs.every((f) => compressionData.has(f));

    // Parse data rows (unless all fields are compressed)
    const items: ASTNode[] = [];

    if (allFieldsCompressed && compressionData.size > 0) {
      // Build items from compression data
      for (let i = 0; i < count; i++) {
        const row = new Map<string, ASTNode>();
        for (const field of fieldDefs) {
          const values = compressionData.get(field);
          const value = values?.[i];
          row.set(field, {
            type: 'primitive',
            valueType: this.inferValueType(value),
            value,
          });
        }
        items.push({ type: 'object', fields: row });
      }
    } else {
      // Parse row data normally
      for (let i = 0; i < count; i++) {
        this.skipWhitespace();

        if (this.isAtEnd()) {
          break;
        }

        // Parse row as object
        const row = new Map<string, ASTNode>();

        for (let j = 0; j < fieldDefs.length; j++) {
          const fieldName = fieldDefs[j]!;
          const fieldType = fieldTypes[j]!;

          // Check if this field has compression data
          if (compressionData.has(fieldName)) {
            // Skip the placeholder (~) if present
            if (this.check(TokenType.TILDE)) {
              this.advance();
            }
            // Use decompressed value
            const values = compressionData.get(fieldName)!;
            row.set(fieldName, {
              type: 'primitive',
              valueType: this.inferValueType(values[i]),
              value: values[i],
            });
          } else {
            // Parse value normally
            const value = this.parseRowValue(fieldType);
            row.set(fieldName, value);
          }

          // Expect pipe between fields (except last)
          if (j < fieldDefs.length - 1) {
            this.consume(TokenType.PIPE, 'Expected "|" between fields');
          }
        }

        items.push({
          type: 'object',
          fields: row,
        });

        this.skipWhitespace();
      }
    }

    return {
      type: 'array',
      name: name ?? undefined,
      count,
      items,
      compressionData: compressionData.size > 0 ? compressionData : undefined,
    };
  }

  /**
   * Parse a field definition (name:type@compression)
   */
  private parseFieldDef(): { fieldName: string; fieldType: string; compression: string | undefined } {
    const fieldName = this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
    let fieldType = 'str';
    let compression: string | undefined = undefined;

    // Check for type annotation (field:type or field:type@compression)
    if (this.check(TokenType.COLON)) {
      this.advance();
      // Type might include @compression marker
      const typeToken = this.consume(TokenType.IDENTIFIER, 'Expected type name');
      const typeParts = typeToken.value.split('@');
      fieldType = typeParts[0]!;
      compression = typeParts[1];
    }

    // Check for standalone @ compression marker
    if (this.check(TokenType.AT)) {
      this.advance();
      compression = this.consume(TokenType.IDENTIFIER, 'Expected compression type').value;
    }

    return { fieldName, fieldType, compression };
  }

  /**
   * Parse a row value
   */
  private parseRowValue(fieldType: string): ASTNode {
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'str',
        value: token.value,
      };
    } else if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      const numValue = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value, 10);
      const numType = fieldType.startsWith('f') ? 'f32' : 'i32';
      return {
        type: 'primitive',
        valueType: numType as any,
        value: numValue,
      };
    } else if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'bool',
        value: token.value === 'true',
      };
    } else if (this.check(TokenType.NULL)) {
      this.advance();
      return {
        type: 'primitive',
        valueType: 'null',
        value: null,
      };
    } else if (this.check(TokenType.TILDE)) {
      // Placeholder for compressed field
      this.advance();
      return {
        type: 'primitive',
        valueType: 'null',
        value: null,
      };
    } else if (this.check(TokenType.IDENTIFIER)) {
      // Unquoted string
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'str',
        value: token.value,
      };
    } else {
      throw this.error('Expected value');
    }
  }

  /**
   * Parse compression directive line (@rle:field data)
   */
  private parseCompressionDirective(): { type: string; field: string; data: string } | null {
    if (!this.check(TokenType.AT)) return null;

    this.advance(); // consume @

    // Get directive type (rle, dict, idx, delta)
    if (!this.check(TokenType.IDENTIFIER)) return null;
    const type = this.advance().value;

    // Expect colon
    if (!this.check(TokenType.COLON)) return null;
    this.advance();

    // Get field name
    if (!this.check(TokenType.IDENTIFIER)) return null;
    const field = this.advance().value;

    this.skipWhitespace();

    // Collect remaining tokens on line as data
    const dataTokens: string[] = [];
    while (!this.check(TokenType.NEWLINE) && !this.check(TokenType.AT) && !this.isAtEnd()) {
      const token = this.advance();
      dataTokens.push(token.value);
    }

    return { type, field, data: dataTokens.join('') };
  }

  /**
   * Infer primitive value type
   */
  private inferValueType(value: any): any {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number') return Number.isInteger(value) ? 'i32' : 'f32';
    return 'str';
  }

  /**
   * Parse inline array
   * Format: [count]: value1, value2, ...
   */
  private parseInlineArray(): ArrayNode {
    this.consume(TokenType.LBRACKET, 'Expected "["');

    const countToken = this.consume(TokenType.NUMBER, 'Expected array count');
    const count = parseInt(countToken.value, 10);

    this.consume(TokenType.RBRACKET, 'Expected "]"');
    this.consume(TokenType.COLON, 'Expected ":"');
    this.skipWhitespace();

    const items: ASTNode[] = [];

    for (let i = 0; i < count; i++) {
      this.skipWhitespace();

      if (this.isAtEnd()) {
        break;
      }

      const value = this.parsePrimitive();
      items.push(value);

      // Optional comma
      if (i < count - 1 && this.check(TokenType.COMMA)) {
        this.advance();
        this.skipWhitespace();
      }
    }

    return {
      type: 'array',
      count,
      items,
    };
  }

  /**
   * Parse primitive value
   */
  private parsePrimitive(): PrimitiveNode {
    this.skipWhitespace();

    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'str',
        value: token.value,
      };
    }

    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      const value = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value, 10);
      const valueType = token.value.includes('.') ? 'f32' : 'i32';
      return {
        type: 'primitive',
        valueType: valueType as any,
        value,
      };
    }

    if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'bool',
        value: token.value === 'true',
      };
    }

    if (this.check(TokenType.NULL)) {
      this.advance();
      return {
        type: 'primitive',
        valueType: 'null',
        value: null,
      };
    }

    if (this.check(TokenType.IDENTIFIER)) {
      // Unquoted string
      const token = this.advance();
      return {
        type: 'primitive',
        valueType: 'str',
        value: token.value,
      };
    }

    throw this.error('Expected primitive value');
  }

  /**
   * Skip whitespace and newlines
   */
  private skipWhitespace(): void {
    while (this.check(TokenType.NEWLINE) || this.check(TokenType.INDENT)) {
      this.advance();
    }
  }

  /**
   * Check if current token matches type
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Consume token of expected type
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(message);
  }

  /**
   * Advance to next token
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  /**
   * Peek at current token
   */
  private peek(): Token {
    return this.tokens[this.current]!;
  }

  /**
   * Peek ahead N tokens
   */
  private peekAhead(n: number): Token | undefined {
    const index = this.current + n;
    if (index >= this.tokens.length) {
      return undefined;
    }
    return this.tokens[index];
  }

  /**
   * Get previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1]!;
  }

  /**
   * Check if at end of tokens
   */
  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  /**
   * Create parse error
   */
  private error(message: string): AXONParseError {
    const token = this.peek();
    return new AXONParseError(message, token.line, token.column, token.value);
  }
}

/**
 * Parse AXON tokens into AST
 */
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  return parser.parse();
}
