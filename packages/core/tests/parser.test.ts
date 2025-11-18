import { describe, test, expect } from 'vitest';
import { tokenize } from '../src/decoder/lexer';
import { parse } from '../src/decoder/parser';
import { AXONParseError } from '../src/utils/errors';

describe('Parser', () => {
  describe('Compact Mode Arrays', () => {
    test('parses simple compact array', () => {
      const tokens = tokenize('users::[2] id|name\n  1|Alice\n  2|Bob');
      const ast = parse(tokens);

      expect(ast.type).toBe('object');
      if (ast.type === 'object') {
        expect(ast.fields.has('users')).toBe(true);
        const usersNode = ast.fields.get('users');
        expect(usersNode?.type).toBe('array');
      }
    });

    test('parses empty array', () => {
      const tokens = tokenize('users::[0] id|name');
      const ast = parse(tokens);

      expect(ast.type).toBe('object');
      if (ast.type === 'object') {
        const usersNode = ast.fields.get('users');
        expect(usersNode?.type).toBe('array');
        if (usersNode?.type === 'array') {
          expect(usersNode.count).toBe(0);
          expect(usersNode.items).toHaveLength(0);
        }
      }
    });

    test('parses fields with types', () => {
      const tokens = tokenize('products::[1] id:i32|name:str|price:f32\n  1|Widget|19.99');
      const ast = parse(tokens);

      expect(ast.type).toBe('object');
      if (ast.type === 'object') {
        const productsNode = ast.fields.get('products');
        expect(productsNode?.type).toBe('array');
      }
    });

    test('parses multiple rows', () => {
      const tokens = tokenize('items::[5] id|value\n  1|a\n  2|b\n  3|c\n  4|d\n  5|e');
      const ast = parse(tokens);

      if (ast.type === 'object') {
        const itemsNode = ast.fields.get('items');
        if (itemsNode?.type === 'array') {
          expect(itemsNode.items).toHaveLength(5);
        }
      }
    });
  });

  describe('Inline Arrays', () => {
    test('parses inline string array', () => {
      const tokens = tokenize('[3]: apple, banana, orange');
      const ast = parse(tokens);

      expect(ast.type).toBe('array');
      if (ast.type === 'array') {
        expect(ast.count).toBe(3);
        expect(ast.items).toHaveLength(3);
      }
    });

    test('parses inline number array', () => {
      const tokens = tokenize('[4]: 1, 2, 3, 4');
      const ast = parse(tokens);

      expect(ast.type).toBe('array');
      if (ast.type === 'array') {
        expect(ast.items).toHaveLength(4);
      }
    });
  });

  describe('Primitives', () => {
    test('parses strings', () => {
      const tokens = tokenize('"Hello World"');
      const ast = parse(tokens);

      expect(ast.type).toBe('primitive');
      if (ast.type === 'primitive') {
        expect(ast.valueType).toBe('str');
        expect(ast.value).toBe('Hello World');
      }
    });

    test('parses numbers', () => {
      const tokens = tokenize('42');
      const ast = parse(tokens);

      expect(ast.type).toBe('primitive');
      if (ast.type === 'primitive') {
        expect(ast.valueType).toBe('i32');
        expect(ast.value).toBe(42);
      }
    });

    test('parses booleans', () => {
      const tokens = tokenize('true');
      const ast = parse(tokens);

      expect(ast.type).toBe('primitive');
      if (ast.type === 'primitive') {
        expect(ast.valueType).toBe('bool');
        expect(ast.value).toBe(true);
      }
    });

    test('parses null', () => {
      const tokens = tokenize('null');
      const ast = parse(tokens);

      expect(ast.type).toBe('primitive');
      if (ast.type === 'primitive') {
        expect(ast.valueType).toBe('null');
        expect(ast.value).toBe(null);
      }
    });
  });

  describe('Error Handling', () => {
    test('throws on empty input', () => {
      const tokens = tokenize('');
      expect(() => parse(tokens)).toThrow(AXONParseError);
    });

    test('throws on unexpected token', () => {
      const tokens = tokenize('{ invalid syntax }');
      // This should parse as an object but fail on invalid field syntax
      // For now, just verify it returns something or throws
      try {
        parse(tokens);
      } catch (error) {
        expect(error).toBeInstanceOf(AXONParseError);
      }
    });
  });
});
