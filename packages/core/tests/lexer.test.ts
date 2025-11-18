import { describe, test, expect } from 'vitest';
import { tokenize } from '../src/decoder/lexer';
import { TokenType } from '../src/types';
import { AXONParseError } from '../src/utils/errors';

describe('Lexer', () => {
  describe('Basic Tokens', () => {
    test('tokenizes simple identifiers', () => {
      const tokens = tokenize('name age active');

      expect(tokens).toHaveLength(4); // 3 identifiers + EOF
      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0]?.value).toBe('name');
      expect(tokens[1]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.value).toBe('age');
      expect(tokens[2]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2]?.value).toBe('active');
      expect(tokens[3]?.type).toBe(TokenType.EOF);
    });

    test('tokenizes numbers', () => {
      const tokens = tokenize('42 -128 3.14 -2.5 1.5e10 -3.2e-5');

      expect(tokens).toHaveLength(7); // 6 numbers + EOF
      expect(tokens[0]?.type).toBe(TokenType.NUMBER);
      expect(tokens[0]?.value).toBe('42');
      expect(tokens[1]?.type).toBe(TokenType.NUMBER);
      expect(tokens[1]?.value).toBe('-128');
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
      expect(tokens[2]?.value).toBe('3.14');
      expect(tokens[3]?.type).toBe(TokenType.NUMBER);
      expect(tokens[3]?.value).toBe('-2.5');
      expect(tokens[4]?.type).toBe(TokenType.NUMBER);
      expect(tokens[4]?.value).toBe('1.5e10');
      expect(tokens[5]?.type).toBe(TokenType.NUMBER);
      expect(tokens[5]?.value).toBe('-3.2e-5');
    });

    test('tokenizes booleans', () => {
      const tokens = tokenize('true false');

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe(TokenType.BOOLEAN);
      expect(tokens[0]?.value).toBe('true');
      expect(tokens[1]?.type).toBe(TokenType.BOOLEAN);
      expect(tokens[1]?.value).toBe('false');
    });

    test('tokenizes null', () => {
      const tokens = tokenize('null');

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.type).toBe(TokenType.NULL);
      expect(tokens[0]?.value).toBe('null');
    });

    test('tokenizes strings', () => {
      const tokens = tokenize('"Hello World" "Alice"');

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe(TokenType.STRING);
      expect(tokens[0]?.value).toBe('Hello World');
      expect(tokens[1]?.type).toBe(TokenType.STRING);
      expect(tokens[1]?.value).toBe('Alice');
    });
  });

  describe('String Escapes', () => {
    test('handles escape sequences', () => {
      const tokens = tokenize('"Line 1\\nLine 2" "Tab\\there" "Quote:\\"Hello\\""');

      expect(tokens).toHaveLength(4);
      expect(tokens[0]?.value).toBe('Line 1\nLine 2');
      expect(tokens[1]?.value).toBe('Tab\there');
      expect(tokens[2]?.value).toBe('Quote:"Hello"');
    });

    test('handles unicode escapes', () => {
      const tokens = tokenize('"Hello \\u4E16\\u754C"');

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.value).toBe('Hello 世界');
    });

    test('throws on invalid escape sequence', () => {
      expect(() => tokenize('"Invalid\\x"')).toThrow(AXONParseError);
    });

    test('throws on unterminated string', () => {
      expect(() => tokenize('"Unterminated')).toThrow(AXONParseError);
    });

    test('throws on string with newline', () => {
      expect(() => tokenize('"Multi\nline"')).toThrow(AXONParseError);
    });
  });

  describe('Punctuation', () => {
    test('tokenizes colons', () => {
      const tokens = tokenize(': ::');

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe(TokenType.COLON);
      expect(tokens[0]?.value).toBe(':');
      expect(tokens[1]?.type).toBe(TokenType.DOUBLE_COLON);
      expect(tokens[1]?.value).toBe('::');
    });

    test('tokenizes delimiters', () => {
      const tokens = tokenize('| , .');

      expect(tokens).toHaveLength(4);
      expect(tokens[0]?.type).toBe(TokenType.PIPE);
      expect(tokens[1]?.type).toBe(TokenType.COMMA);
      expect(tokens[2]?.type).toBe(TokenType.DOT);
    });

    test('tokenizes brackets', () => {
      const tokens = tokenize('{ } [ ] ( )');

      expect(tokens).toHaveLength(7);
      expect(tokens[0]?.type).toBe(TokenType.LBRACE);
      expect(tokens[1]?.type).toBe(TokenType.RBRACE);
      expect(tokens[2]?.type).toBe(TokenType.LBRACKET);
      expect(tokens[3]?.type).toBe(TokenType.RBRACKET);
      expect(tokens[4]?.type).toBe(TokenType.LPAREN);
      expect(tokens[5]?.type).toBe(TokenType.RPAREN);
    });

    test('tokenizes special characters', () => {
      const tokens = tokenize('@ ! ? + - =');

      expect(tokens).toHaveLength(7);
      expect(tokens[0]?.type).toBe(TokenType.AT);
      expect(tokens[1]?.type).toBe(TokenType.BANG);
      expect(tokens[2]?.type).toBe(TokenType.QUESTION);
      expect(tokens[3]?.type).toBe(TokenType.PLUS);
      expect(tokens[4]?.type).toBe(TokenType.MINUS);
      expect(tokens[5]?.type).toBe(TokenType.EQUALS);
    });
  });

  describe('Comments', () => {
    test('tokenizes line comments', () => {
      const tokens = tokenize('name // This is a comment\nage');

      expect(tokens).toHaveLength(5); // name, comment, newline, age, EOF
      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0]?.value).toBe('name');
      expect(tokens[1]?.type).toBe(TokenType.COMMENT);
      expect(tokens[1]?.value).toBe('// This is a comment');
      expect(tokens[2]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[3]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[3]?.value).toBe('age');
    });

    test('tokenizes block comments', () => {
      const tokens = tokenize('name /* Multi\nline\ncomment */ age');

      expect(tokens).toHaveLength(4); // name, comment, age, EOF
      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.type).toBe(TokenType.COMMENT);
      expect(tokens[2]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2]?.value).toBe('age');
    });

    test('throws on unterminated block comment', () => {
      expect(() => tokenize('/* Unterminated')).toThrow(AXONParseError);
    });
  });

  describe('Whitespace', () => {
    test('handles newlines', () => {
      const tokens = tokenize('name\nage\nactive');

      expect(tokens).toHaveLength(6); // 3 identifiers + 2 newlines + EOF
      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[2]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[3]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[4]?.type).toBe(TokenType.IDENTIFIER);
    });

    test('tracks line and column numbers', () => {
      const tokens = tokenize('name\n  age');

      expect(tokens[0]?.line).toBe(1);
      expect(tokens[0]?.column).toBe(1);
      expect(tokens[1]?.line).toBe(1); // Newline
      expect(tokens[2]?.line).toBe(2);
    });
  });

  describe('Complex Expressions', () => {
    test('tokenizes AXON compact mode header', () => {
      const tokens = tokenize('users::[3] id:i32|name:str|active:bool');

      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0]?.value).toBe('users');
      expect(tokens[1]?.type).toBe(TokenType.DOUBLE_COLON);
      expect(tokens[2]?.type).toBe(TokenType.LBRACKET);
      expect(tokens[3]?.type).toBe(TokenType.NUMBER);
      expect(tokens[3]?.value).toBe('3');
      expect(tokens[4]?.type).toBe(TokenType.RBRACKET);
    });

    test('tokenizes object syntax', () => {
      const tokens = tokenize('user: { id: 123, name: "Alice" }');

      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0]?.value).toBe('user');
      expect(tokens[1]?.type).toBe(TokenType.COLON);
      expect(tokens[2]?.type).toBe(TokenType.LBRACE);
      expect(tokens[3]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[3]?.value).toBe('id');
      expect(tokens[4]?.type).toBe(TokenType.COLON);
      expect(tokens[5]?.type).toBe(TokenType.NUMBER);
      expect(tokens[5]?.value).toBe('123');
    });

    test('tokenizes schema definition', () => {
      const tokens = tokenize('@schemas:\n  User: id:i32|name:str');

      expect(tokens[0]?.type).toBe(TokenType.AT);
      expect(tokens[1]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.value).toBe('schemas');
      expect(tokens[2]?.type).toBe(TokenType.COLON);
      expect(tokens[3]?.type).toBe(TokenType.NEWLINE);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty input', () => {
      const tokens = tokenize('');

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.type).toBe(TokenType.EOF);
    });

    test('handles whitespace-only input', () => {
      const tokens = tokenize('   \n  \t  \n  ');

      expect(tokens).toHaveLength(3); // 2 newlines + EOF
      expect(tokens[0]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[1]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[2]?.type).toBe(TokenType.EOF);
    });

    test('throws on unexpected character', () => {
      expect(() => tokenize('name $ age')).toThrow(AXONParseError);
    });

    test('handles complex identifiers', () => {
      const tokens = tokenize('user_name product-id api.endpoint iso8601 uuid-short');

      expect(tokens[0]?.value).toBe('user_name');
      expect(tokens[1]?.value).toBe('product-id');
      expect(tokens[2]?.value).toBe('api.endpoint');
      expect(tokens[3]?.value).toBe('iso8601');
      expect(tokens[4]?.value).toBe('uuid-short');
    });
  });
});
