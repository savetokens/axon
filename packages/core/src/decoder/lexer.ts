import type { Token } from '../types';
import { TokenType } from '../types';
import { AXONParseError } from '../utils/errors';

/**
 * Lexer for tokenizing AXON input
 */
export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Tokenize the entire input
   */
  public tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.scanToken();
    }

    // Add EOF token
    this.addToken(TokenType.EOF, '');

    return this.tokens;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    const char = this.peek();

    // Skip whitespace (except newlines)
    if (char === ' ' || char === '\r' || char === '\t') {
      this.advance();
      return;
    }

    // Newline
    if (char === '\n') {
      this.addToken(TokenType.NEWLINE, char);
      this.advance();
      this.line++;
      this.column = 1;
      return;
    }

    // Comments
    if (char === '/' && this.peekNext() === '/') {
      this.scanLineComment();
      return;
    }

    if (char === '/' && this.peekNext() === '*') {
      this.scanBlockComment();
      return;
    }

    // Quoted strings
    if (char === '"') {
      this.scanString();
      return;
    }

    // Numbers
    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekNext()))) {
      this.scanNumber();
      return;
    }

    // Identifiers and keywords
    if (this.isIdentifierStart(char)) {
      this.scanIdentifier();
      return;
    }

    // Punctuation and operators
    switch (char) {
      case ':':
        if (this.peekNext() === ':') {
          this.advance();
          this.advance();
          this.addToken(TokenType.DOUBLE_COLON, '::');
        } else {
          this.advance();
          this.addToken(TokenType.COLON, ':');
        }
        break;

      case '|':
        this.advance();
        this.addToken(TokenType.PIPE, '|');
        break;

      case ',':
        this.advance();
        this.addToken(TokenType.COMMA, ',');
        break;

      case '.':
        this.advance();
        this.addToken(TokenType.DOT, '.');
        break;

      case '{':
        this.advance();
        this.addToken(TokenType.LBRACE, '{');
        break;

      case '}':
        this.advance();
        this.addToken(TokenType.RBRACE, '}');
        break;

      case '[':
        this.advance();
        this.addToken(TokenType.LBRACKET, '[');
        break;

      case ']':
        this.advance();
        this.addToken(TokenType.RBRACKET, ']');
        break;

      case '(':
        this.advance();
        this.addToken(TokenType.LPAREN, '(');
        break;

      case ')':
        this.advance();
        this.addToken(TokenType.RPAREN, ')');
        break;

      case '@':
        this.advance();
        this.addToken(TokenType.AT, '@');
        break;

      case '!':
        this.advance();
        this.addToken(TokenType.BANG, '!');
        break;

      case '?':
        this.advance();
        this.addToken(TokenType.QUESTION, '?');
        break;

      case '+':
        this.advance();
        this.addToken(TokenType.PLUS, '+');
        break;

      case '-':
        this.advance();
        this.addToken(TokenType.MINUS, '-');
        break;

      case '=':
        this.advance();
        this.addToken(TokenType.EQUALS, '=');
        break;

      case '*':
        this.advance();
        this.addToken(TokenType.ASTERISK, '*');
        break;

      case '~':
        this.advance();
        this.addToken(TokenType.TILDE, '~');
        break;

      case '#':
        // # style comments (AXON stats output uses this)
        this.scanHashComment();
        break;

      default:
        throw new AXONParseError(
          `Unexpected character: '${char}'`,
          this.line,
          this.column,
          char
        );
    }
  }

  /**
   * Scan a quoted string
   */
  private scanString(): void {
    const start = this.position;
    this.advance(); // Skip opening quote

    let value = '';

    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        throw new AXONParseError(
          'Unterminated string',
          this.line,
          this.column,
          this.input.substring(start, this.position)
        );
      }

      // Handle escape sequences
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.peek();

        switch (escaped) {
          case '"':
            value += '"';
            break;
          case '\\':
            value += '\\';
            break;
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case 'u':
            // Unicode escape: \uXXXX
            this.advance();
            const hex = this.input.substring(this.position, this.position + 4);
            if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new AXONParseError(
                'Invalid unicode escape',
                this.line,
                this.column,
                `\\u${hex}`
              );
            }
            value += String.fromCharCode(parseInt(hex, 16));
            this.position += 3; // Advance over the hex digits (we'll advance one more below)
            break;
          default:
            throw new AXONParseError(
              `Invalid escape sequence: \\${escaped}`,
              this.line,
              this.column,
              `\\${escaped}`
            );
        }
        this.advance();
      } else {
        value += this.peek();
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new AXONParseError('Unterminated string', this.line, this.column);
    }

    this.advance(); // Skip closing quote

    this.addToken(TokenType.STRING, value);
  }

  /**
   * Scan a number
   */
  private scanNumber(): void {
    const start = this.position;

    // Handle negative sign
    if (this.peek() === '-') {
      this.advance();
    }

    // Integer part
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Skip dot

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();

      if (this.peek() === '+' || this.peek() === '-') {
        this.advance();
      }

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.input.substring(start, this.position);
    this.addToken(TokenType.NUMBER, value);
  }

  /**
   * Scan an identifier or keyword
   */
  private scanIdentifier(): void {
    const start = this.position;

    while (this.isIdentifierChar(this.peek())) {
      this.advance();
    }

    const value = this.input.substring(start, this.position);

    // Check for keywords
    if (value === 'true' || value === 'false') {
      this.addToken(TokenType.BOOLEAN, value);
    } else if (value === 'null') {
      this.addToken(TokenType.NULL, value);
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  /**
   * Scan a line comment
   */
  private scanLineComment(): void {
    const start = this.position;

    // Skip //
    this.advance();
    this.advance();

    // Read until newline
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }

    const value = this.input.substring(start, this.position);
    this.addToken(TokenType.COMMENT, value);
  }

  /**
   * Scan a hash-style comment (used in stats output)
   */
  private scanHashComment(): void {
    const start = this.position;

    // Skip #
    this.advance();

    // Read until newline
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }

    const value = this.input.substring(start, this.position);
    this.addToken(TokenType.COMMENT, value);
  }

  /**
   * Scan a block comment
   */
  private scanBlockComment(): void {
    const start = this.position;

    // Skip /*
    this.advance();
    this.advance();

    // Read until */
    while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new AXONParseError('Unterminated block comment', this.line, this.column);
    }

    // Skip */
    this.advance();
    this.advance();

    const value = this.input.substring(start, this.position);
    this.addToken(TokenType.COMMENT, value);
  }

  /**
   * Add a token to the list
   */
  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    });
  }

  /**
   * Advance position and column
   */
  private advance(): void {
    this.position++;
    this.column++;
  }

  /**
   * Peek at current character
   */
  private peek(): string {
    if (this.isAtEnd()) {
      return '\0';
    }
    return this.input[this.position]!;
  }

  /**
   * Peek at next character
   */
  private peekNext(): string {
    if (this.position + 1 >= this.input.length) {
      return '\0';
    }
    return this.input[this.position + 1]!;
  }

  /**
   * Check if at end of input
   */
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  /**
   * Check if character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Check if character can start an identifier
   */
  private isIdentifierStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  /**
   * Check if character can be in an identifier
   */
  private isIdentifierChar(char: string): boolean {
    return (
      this.isIdentifierStart(char) ||
      this.isDigit(char) ||
      char === '-' ||
      char === '.' ||
      char === '@' ||
      char === '/'
    );
  }
}

/**
 * Tokenize AXON input
 */
export function tokenize(input: string): Token[] {
  const lexer = new Lexer(input);
  return lexer.tokenize();
}
