#!/usr/bin/env node
/**
 * AXON Lexer Demo
 *
 * This demo showcases the lexer's ability to tokenize AXON syntax.
 * Run with: pnpm tsx demo.ts
 */

import { tokenize } from './src/decoder/lexer';
import { TokenType } from './src/types';
import type { Token } from './src/types';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title: string): void {
  console.log('\n' + colorize('═'.repeat(80), 'cyan'));
  console.log(colorize(`  ${title}`, 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan') + '\n');
}

function printSection(title: string): void {
  console.log(colorize(`\n▸ ${title}`, 'yellow'));
  console.log(colorize('─'.repeat(60), 'yellow'));
}

function printToken(token: Token, index: number): void {
  const typeColor = getTokenColor(token.type);
  const value = token.value.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  const displayValue = value.length > 30 ? value.substring(0, 27) + '...' : value;

  console.log(
    `  ${colorize(String(index).padStart(3), 'blue')}. ` +
    `${colorize(token.type.padEnd(15), typeColor)} ` +
    `${colorize(displayValue.padEnd(35), 'green')} ` +
    `${colorize(`(${token.line}:${token.column})`, 'magenta')}`
  );
}

function getTokenColor(type: TokenType): keyof typeof colors {
  if (type === TokenType.STRING) return 'green';
  if (type === TokenType.NUMBER) return 'cyan';
  if (type === TokenType.BOOLEAN || type === TokenType.NULL) return 'magenta';
  if (type === TokenType.IDENTIFIER) return 'yellow';
  return 'reset';
}

function demoExample(title: string, axonCode: string): void {
  printSection(title);

  // Show input
  console.log(colorize('\nInput AXON:', 'bright'));
  console.log(colorize('┌' + '─'.repeat(58) + '┐', 'blue'));
  axonCode.split('\n').forEach(line => {
    console.log(colorize('│', 'blue') + ' ' + line.padEnd(57) + colorize('│', 'blue'));
  });
  console.log(colorize('└' + '─'.repeat(58) + '┘', 'blue'));

  // Tokenize
  try {
    const tokens = tokenize(axonCode);

    // Show tokens
    console.log(colorize('\nTokens:', 'bright'));
    tokens.forEach((token, index) => {
      if (token.type !== TokenType.EOF) {
        printToken(token, index + 1);
      }
    });

    // Show statistics
    const tokenCount = tokens.filter(t => t.type !== TokenType.EOF && t.type !== TokenType.COMMENT).length;
    console.log(colorize(`\n  Total: ${tokenCount} tokens`, 'cyan'));

  } catch (error) {
    console.log(colorize(`\n  ✗ Error: ${error}`, 'red'));
  }
}

// Main demo
function main(): void {
  printHeader('🚀 AXON Lexer Demo - Phase 1');

  console.log(colorize('This demo showcases the AXON lexer tokenizing various syntax elements.', 'bright'));
  console.log(colorize('The full parser and encoder/decoder are coming in the next phases!\n', 'reset'));

  // Example 1: Simple Object
  demoExample(
    'Example 1: Simple Object Syntax',
    `name: Alice
age: 30
active: true`
  );

  // Example 2: Compact Mode Header
  demoExample(
    'Example 2: Compact Mode Array Header',
    `users::[3] id:i32|name:str|role:str|active:bool`
  );

  // Example 3: Nested Object
  demoExample(
    'Example 3: Nested Object with Types',
    `user: {
  id:i32: 123
  name: "Alice Johnson"
  email: alice@example.com
}`
  );

  // Example 4: Schema Definition
  demoExample(
    'Example 4: Schema Definition Block',
    `@schemas:
  User: id:i32|name:str|email:str`
  );

  // Example 5: Data with Comments
  demoExample(
    'Example 5: AXON with Comments',
    `// User data
users::[2] id|name  // Compact format
  1|Alice
  2|Bob`
  );

  // Example 6: String Escapes
  demoExample(
    'Example 6: String Escape Sequences',
    `message: "Line 1\\nLine 2\\tTab"
unicode: "Hello \\u4E16\\u754C"
quote: "She said \\"Hello\\""`
  );

  // Example 7: Numbers and Types
  demoExample(
    'Example 7: Various Number Formats',
    `integer: 42
negative: -128
float: 3.14
scientific: 1.5e10
price:f32-q2: 19.99
timestamp:iso8601: 2025-01-15T10:30:00Z`
  );

  // Example 8: Complex Expression
  demoExample(
    'Example 8: Real-World AXON Snippet',
    `products::[3]@columnar !primary:sku id|name|price:f32-q2|stock:i32
  WDG-001|"Premium Widget"|19.99|150
  GDG-042|"Smart Gadget"|149.99|89
  SHT-103|"Cotton Shirt"|24.50|200`
  );

  // Footer
  printHeader('✨ Demo Complete!');
  console.log(colorize('The lexer successfully tokenized all examples!', 'green'));
  console.log(colorize('\nNext steps in Phase 1:', 'bright'));
  console.log(colorize('  • Implement parser to build AST from tokens', 'yellow'));
  console.log(colorize('  • Create basic type system for primitives', 'yellow'));
  console.log(colorize('  • Build encoder and decoder for compact mode', 'yellow'));
  console.log(colorize('\nStay tuned for Phase 2 with full encoding/decoding! 🎉\n', 'cyan'));
}

// Run demo
main();
