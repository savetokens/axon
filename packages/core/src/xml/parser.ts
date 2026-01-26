/**
 * Lightweight XML parser for AXON
 * Parses XML string into XmlNode tree structure
 */

import type { XmlNode, XmlDocument, XmlChildNode, XmlParseOptions, XmlProcessingInstruction, XmlDoctype } from './types';
import { AXONXmlParseError } from './errors';

/**
 * Internal parser state
 */
interface ParserState {
  input: string;
  pos: number;
  line: number;
  column: number;
  options: Required<XmlParseOptions>;
}

/**
 * Default parse options
 */
const DEFAULT_OPTIONS: Required<XmlParseOptions> = {
  preserveWhitespace: false,
  preserveComments: false,
  preserveCdata: true,
  preserveProcessingInstructions: false,
  normalizeNamespaces: true,
};

/**
 * Parse an XML string into an XmlDocument
 */
export function parseXml(input: string, options?: XmlParseOptions): XmlDocument {
  const state: ParserState = {
    input,
    pos: 0,
    line: 1,
    column: 1,
    options: { ...DEFAULT_OPTIONS, ...options },
  };

  const doc: XmlDocument = {
    root: { _name: '' },
  };

  const processingInstructions: XmlProcessingInstruction[] = [];
  const comments: string[] = [];

  skipWhitespace(state);

  // Parse prolog (XML declaration, DOCTYPE, PIs, comments)
  while (state.pos < state.input.length) {
    if (peek(state, '<?xml ') || peek(state, '<?xml\t') || peek(state, '<?xml\n') || peek(state, '<?xml\r')) {
      const decl = parseXmlDeclaration(state);
      if (decl.version !== undefined) {
        doc.version = decl.version;
      }
      if (decl.encoding !== undefined) {
        doc.encoding = decl.encoding;
      }
      if (decl.standalone !== undefined) {
        doc.standalone = decl.standalone;
      }
    } else if (peek(state, '<?')) {
      const pi = parseProcessingInstruction(state);
      if (state.options.preserveProcessingInstructions) {
        processingInstructions.push(pi);
      }
    } else if (peek(state, '<!DOCTYPE')) {
      doc.doctype = parseDoctype(state);
    } else if (peek(state, '<!--')) {
      const comment = parseComment(state);
      if (state.options.preserveComments) {
        comments.push(comment);
      }
    } else if (peek(state, '<') && !peek(state, '</')) {
      // Found root element
      break;
    } else {
      skipWhitespace(state);
      if (state.pos >= state.input.length) break;
      if (!peek(state, '<')) {
        throw error(state, 'Expected element or declaration');
      }
    }
    skipWhitespace(state);
  }

  // Parse root element
  if (state.pos >= state.input.length || !peek(state, '<')) {
    throw error(state, 'No root element found');
  }

  doc.root = parseElement(state);

  if (processingInstructions.length > 0) {
    doc.processingInstructions = processingInstructions;
  }
  if (comments.length > 0) {
    doc.comments = comments;
  }

  // Skip trailing whitespace and comments
  skipWhitespace(state);
  while (peek(state, '<!--')) {
    parseComment(state);
    skipWhitespace(state);
  }

  return doc;
}

/**
 * Parse an XML string into just the root XmlNode (convenience function)
 */
export function parseXmlElement(input: string, options?: XmlParseOptions): XmlNode {
  return parseXml(input, options).root;
}

/**
 * Parse XML declaration
 */
function parseXmlDeclaration(state: ParserState): {
  version?: string;
  encoding?: string;
  standalone?: 'yes' | 'no';
} {
  expect(state, '<?xml');
  const result: { version?: string; encoding?: string; standalone?: 'yes' | 'no' } = {};

  skipWhitespace(state);

  // Parse attributes
  while (!peek(state, '?>')) {
    if (state.pos >= state.input.length) {
      throw error(state, 'Unclosed XML declaration');
    }

    const name = parseName(state);
    skipWhitespace(state);
    expect(state, '=');
    skipWhitespace(state);
    const value = parseQuotedValue(state);

    if (name === 'version') {
      result.version = value;
    } else if (name === 'encoding') {
      result.encoding = value;
    } else if (name === 'standalone') {
      if (value !== 'yes' && value !== 'no') {
        throw error(state, `Invalid standalone value: ${value}`);
      }
      result.standalone = value;
    }

    skipWhitespace(state);
  }

  expect(state, '?>');
  return result;
}

/**
 * Parse processing instruction
 */
function parseProcessingInstruction(state: ParserState): XmlProcessingInstruction {
  expect(state, '<?');
  const target = parseName(state);

  if (target.toLowerCase() === 'xml') {
    throw error(state, 'Processing instruction target cannot be "xml"');
  }

  let data = '';
  skipWhitespace(state);

  const endPos = state.input.indexOf('?>', state.pos);
  if (endPos === -1) {
    throw error(state, 'Unclosed processing instruction');
  }

  data = state.input.slice(state.pos, endPos).trim();
  advanceTo(state, endPos);
  expect(state, '?>');

  return { target, data };
}

/**
 * Parse DOCTYPE declaration
 */
function parseDoctype(state: ParserState): XmlDoctype {
  expect(state, '<!DOCTYPE');
  skipWhitespace(state);

  const name = parseName(state);
  const result: XmlDoctype = { name };

  skipWhitespace(state);

  // Check for PUBLIC or SYSTEM
  if (peek(state, 'PUBLIC')) {
    advance(state, 6);
    skipWhitespace(state);
    result.publicId = parseQuotedValue(state);
    skipWhitespace(state);
    result.systemId = parseQuotedValue(state);
  } else if (peek(state, 'SYSTEM')) {
    advance(state, 6);
    skipWhitespace(state);
    result.systemId = parseQuotedValue(state);
  }

  skipWhitespace(state);

  // Skip internal subset if present
  if (peek(state, '[')) {
    const endPos = state.input.indexOf(']>', state.pos);
    if (endPos === -1) {
      throw error(state, 'Unclosed DOCTYPE internal subset');
    }
    advanceTo(state, endPos + 2);
  } else {
    expect(state, '>');
  }

  return result;
}

/**
 * Parse comment
 */
function parseComment(state: ParserState): string {
  expect(state, '<!--');

  const endPos = state.input.indexOf('-->', state.pos);
  if (endPos === -1) {
    throw error(state, 'Unclosed comment');
  }

  const content = state.input.slice(state.pos, endPos);

  // Check for invalid -- within comment
  if (content.includes('--')) {
    throw error(state, 'Invalid "--" within comment');
  }

  advanceTo(state, endPos);
  expect(state, '-->');

  return content;
}

/**
 * Parse CDATA section
 */
function parseCdata(state: ParserState): string {
  expect(state, '<![CDATA[');

  const endPos = state.input.indexOf(']]>', state.pos);
  if (endPos === -1) {
    throw error(state, 'Unclosed CDATA section');
  }

  const content = state.input.slice(state.pos, endPos);
  advanceTo(state, endPos);
  expect(state, ']]>');

  return content;
}

/**
 * Parse an element
 */
function parseElement(state: ParserState): XmlNode {
  expect(state, '<');

  const name = parseName(state);
  const node: XmlNode = { _name: name };

  // Parse attributes
  const attrs: Record<string, string> = {};
  const namespaces: Record<string, string> = {};

  skipWhitespace(state);

  while (!peek(state, '>') && !peek(state, '/>')) {
    if (state.pos >= state.input.length) {
      throw error(state, `Unclosed start tag for <${name}>`);
    }

    const attrName = parseName(state);
    skipWhitespace(state);
    expect(state, '=');
    skipWhitespace(state);
    const attrValue = parseQuotedValue(state);

    // Handle namespace declarations
    if (attrName === 'xmlns') {
      namespaces[''] = attrValue; // Default namespace
    } else if (attrName.startsWith('xmlns:')) {
      const prefix = attrName.slice(6);
      namespaces[prefix] = attrValue;
    } else {
      attrs[attrName] = attrValue;
    }

    skipWhitespace(state);
  }

  if (Object.keys(attrs).length > 0) {
    node._attrs = attrs;
  }
  if (Object.keys(namespaces).length > 0) {
    node._ns = namespaces;
  }

  // Self-closing tag
  if (peek(state, '/>')) {
    advance(state, 2);
    return node;
  }

  expect(state, '>');

  // Parse content
  const children: XmlChildNode[] = [];
  let textContent = '';
  let cdataContent = '';
  let hasMixedContent = false;

  while (state.pos < state.input.length) {
    if (peek(state, `</${name}`)) {
      break;
    }

    if (peek(state, '</')) {
      // Mismatched closing tag
      const closeTag = state.input.slice(state.pos + 2, state.input.indexOf('>', state.pos));
      throw error(state, `Mismatched closing tag: expected </${name}>, found </${closeTag}>`);
    }

    if (peek(state, '<!--')) {
      // Parse and discard comments in element content
      parseComment(state);
      continue;
    }

    if (peek(state, '<![CDATA[')) {
      const cdata = parseCdata(state);
      if (state.options.preserveCdata) {
        if (children.length > 0 || textContent) {
          hasMixedContent = true;
        }
        cdataContent += cdata;
      } else {
        textContent += cdata;
      }
      continue;
    }

    if (peek(state, '<?')) {
      parseProcessingInstruction(state);
      continue;
    }

    if (peek(state, '<')) {
      // Child element
      if (textContent.trim()) {
        hasMixedContent = true;
        children.push({ _text: state.options.preserveWhitespace ? textContent : textContent.trim() });
        textContent = '';
      } else if (state.options.preserveWhitespace && textContent) {
        children.push({ _text: textContent });
        textContent = '';
      }
      children.push(parseElement(state));
      continue;
    }

    // Text content
    const textEndPos = state.input.indexOf('<', state.pos);
    if (textEndPos === -1) {
      throw error(state, `Unclosed element <${name}>`);
    }

    const text = decodeEntities(state.input.slice(state.pos, textEndPos));
    textContent += text;
    advanceTo(state, textEndPos);
  }

  // Parse closing tag
  expect(state, `</${name}`);
  skipWhitespace(state);
  expect(state, '>');

  // Determine content type
  if (children.length > 0) {
    // Has child elements
    if (hasMixedContent && textContent.trim()) {
      children.push({ _text: state.options.preserveWhitespace ? textContent : textContent.trim() });
    }
    node._children = children;
  } else if (cdataContent) {
    node._cdata = cdataContent;
    if (textContent.trim()) {
      node._text = state.options.preserveWhitespace ? textContent : textContent.trim();
    }
  } else if (textContent) {
    const trimmed = state.options.preserveWhitespace ? textContent : textContent.trim();
    if (trimmed) {
      node._text = trimmed;
    }
  }

  return node;
}

/**
 * Parse a name (element or attribute name)
 */
function parseName(state: ParserState): string {
  const start = state.pos;

  // First character must be letter, underscore, or colon
  const firstChar = state.input[state.pos] ?? '';
  if (!isNameStartChar(firstChar)) {
    throw error(state, `Invalid name start character: ${firstChar}`);
  }

  state.pos++;
  state.column++;

  // Subsequent characters can also include digits, hyphens, periods
  while (state.pos < state.input.length) {
    const char = state.input[state.pos] ?? '';
    if (!isNameChar(char)) break;
    state.pos++;
    state.column++;
  }

  return state.input.slice(start, state.pos);
}

/**
 * Parse a quoted attribute value
 */
function parseQuotedValue(state: ParserState): string {
  const quote = state.input[state.pos];
  if (quote !== '"' && quote !== "'") {
    throw error(state, `Expected quote, got: ${quote}`);
  }

  advance(state, 1);

  const endPos = state.input.indexOf(quote, state.pos);
  if (endPos === -1) {
    throw error(state, 'Unclosed attribute value');
  }

  const value = decodeEntities(state.input.slice(state.pos, endPos));
  advanceTo(state, endPos);
  advance(state, 1);

  return value;
}

/**
 * Decode XML entities
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Check if character is a valid name start character
 */
function isNameStartChar(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    char === '_' ||
    char === ':' ||
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    (code >= 0xc0 && code <= 0xd6) ||
    (code >= 0xd8 && code <= 0xf6) ||
    (code >= 0xf8 && code <= 0x2ff) ||
    (code >= 0x370 && code <= 0x37d) ||
    (code >= 0x37f && code <= 0x1fff) ||
    (code >= 0x200c && code <= 0x200d) ||
    (code >= 0x2070 && code <= 0x218f) ||
    (code >= 0x2c00 && code <= 0x2fef) ||
    (code >= 0x3001 && code <= 0xd7ff) ||
    (code >= 0xf900 && code <= 0xfdcf) ||
    (code >= 0xfdf0 && code <= 0xfffd)
  );
}

/**
 * Check if character is a valid name character
 */
function isNameChar(char: string): boolean {
  if (isNameStartChar(char)) return true;
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    char === '-' ||
    char === '.' ||
    (code >= 48 && code <= 57) || // 0-9
    code === 0xb7 ||
    (code >= 0x300 && code <= 0x36f) ||
    (code >= 0x203f && code <= 0x2040)
  );
}

/**
 * Skip whitespace
 */
function skipWhitespace(state: ParserState): void {
  while (state.pos < state.input.length) {
    const char = state.input[state.pos];
    if (char === ' ' || char === '\t') {
      state.pos++;
      state.column++;
    } else if (char === '\n') {
      state.pos++;
      state.line++;
      state.column = 1;
    } else if (char === '\r') {
      state.pos++;
      if (state.input[state.pos] === '\n') {
        state.pos++;
      }
      state.line++;
      state.column = 1;
    } else {
      break;
    }
  }
}

/**
 * Check if input starts with expected string
 */
function peek(state: ParserState, expected: string): boolean {
  return state.input.slice(state.pos, state.pos + expected.length) === expected;
}

/**
 * Advance position by n characters
 */
function advance(state: ParserState, n: number): void {
  for (let i = 0; i < n; i++) {
    if (state.input[state.pos] === '\n') {
      state.line++;
      state.column = 1;
    } else {
      state.column++;
    }
    state.pos++;
  }
}

/**
 * Advance to specific position
 */
function advanceTo(state: ParserState, pos: number): void {
  while (state.pos < pos) {
    if (state.input[state.pos] === '\n') {
      state.line++;
      state.column = 1;
    } else {
      state.column++;
    }
    state.pos++;
  }
}

/**
 * Expect and consume a specific string
 */
function expect(state: ParserState, expected: string): void {
  if (!peek(state, expected)) {
    const actual = state.input.slice(state.pos, state.pos + expected.length);
    throw error(state, `Expected "${expected}", got "${actual}"`);
  }
  advance(state, expected.length);
}

/**
 * Create a parse error with context
 */
function error(state: ParserState, message: string): AXONXmlParseError {
  const contextStart = Math.max(0, state.pos - 20);
  const contextEnd = Math.min(state.input.length, state.pos + 20);
  const context = state.input.slice(contextStart, contextEnd);
  return new AXONXmlParseError(message, state.line, state.column, context);
}
