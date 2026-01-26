/**
 * XML serializer for AXON
 * Converts XmlNode tree back to XML string
 */

import type { XmlNode, XmlDocument, XmlSerializeOptions } from './types';
import { isXmlNode, isXmlTextNode } from './types';

/**
 * Default serialization options
 */
const DEFAULT_OPTIONS: Required<XmlSerializeOptions> = {
  indent: '  ',
  newline: '\n',
  declaration: true,
  selfClose: true,
  pretty: true,
};

/**
 * Serialize an XmlDocument to an XML string
 */
export function serializeXml(doc: XmlDocument, options?: XmlSerializeOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const parts: string[] = [];

  // XML declaration
  if (opts.declaration) {
    const declParts = ['<?xml version="', doc.version || '1.0', '"'];
    if (doc.encoding) {
      declParts.push(' encoding="', doc.encoding, '"');
    }
    if (doc.standalone) {
      declParts.push(' standalone="', doc.standalone, '"');
    }
    declParts.push('?>');
    parts.push(declParts.join(''));
    if (opts.pretty) {
      parts.push(opts.newline);
    }
  }

  // DOCTYPE
  if (doc.doctype) {
    const doctype = ['<!DOCTYPE ', doc.doctype.name];
    if (doc.doctype.publicId) {
      doctype.push(' PUBLIC "', doc.doctype.publicId, '"');
      if (doc.doctype.systemId) {
        doctype.push(' "', doc.doctype.systemId, '"');
      }
    } else if (doc.doctype.systemId) {
      doctype.push(' SYSTEM "', doc.doctype.systemId, '"');
    }
    doctype.push('>');
    parts.push(doctype.join(''));
    if (opts.pretty) {
      parts.push(opts.newline);
    }
  }

  // Processing instructions
  if (doc.processingInstructions) {
    for (const pi of doc.processingInstructions) {
      parts.push('<?', pi.target);
      if (pi.data) {
        parts.push(' ', pi.data);
      }
      parts.push('?>');
      if (opts.pretty) {
        parts.push(opts.newline);
      }
    }
  }

  // Comments
  if (doc.comments) {
    for (const comment of doc.comments) {
      parts.push('<!--', comment, '-->');
      if (opts.pretty) {
        parts.push(opts.newline);
      }
    }
  }

  // Root element
  parts.push(serializeNode(doc.root, opts, 0));

  return parts.join('');
}

/**
 * Serialize a single XmlNode to an XML string
 */
export function serializeXmlNode(node: XmlNode, options?: XmlSerializeOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return serializeNode(node, opts, 0);
}

/**
 * Internal node serialization
 */
function serializeNode(node: XmlNode, opts: Required<XmlSerializeOptions>, depth: number): string {
  const indent = opts.pretty ? opts.indent.repeat(depth) : '';
  const newline = opts.pretty ? opts.newline : '';
  const parts: string[] = [];

  // Opening tag
  parts.push(indent, '<', node._name);

  // Namespace declarations
  if (node._ns) {
    for (const [prefix, uri] of Object.entries(node._ns)) {
      if (prefix === '') {
        parts.push(' xmlns="', encodeAttribute(uri), '"');
      } else {
        parts.push(' xmlns:', prefix, '="', encodeAttribute(uri), '"');
      }
    }
  }

  // Attributes
  if (node._attrs) {
    for (const [name, value] of Object.entries(node._attrs)) {
      parts.push(' ', name, '="', encodeAttribute(value), '"');
    }
  }

  // Determine content type
  const hasChildren = node._children && node._children.length > 0;
  const hasText = node._text !== undefined;
  const hasCdata = node._cdata !== undefined;
  const isEmpty = !hasChildren && !hasText && !hasCdata;

  // Self-closing or empty element
  if (isEmpty && opts.selfClose) {
    parts.push('/>');
    return parts.join('');
  }

  if (isEmpty) {
    parts.push('></', node._name, '>');
    return parts.join('');
  }

  parts.push('>');

  // Content
  if (hasChildren) {
    const hasMixedContent = node._children!.some(
      (child) => isXmlTextNode(child) && child._text.trim() !== ''
    );

    if (hasMixedContent) {
      // Mixed content: inline without extra whitespace
      for (const child of node._children!) {
        if (isXmlTextNode(child)) {
          parts.push(encodeText(child._text));
        } else if (isXmlNode(child)) {
          parts.push(serializeNode(child, { ...opts, pretty: false }, 0));
        }
      }
    } else {
      // Element-only content: format with newlines
      parts.push(newline);
      for (const child of node._children!) {
        if (isXmlTextNode(child)) {
          // Whitespace-only text nodes in element content - skip
          if (child._text.trim()) {
            parts.push(opts.indent.repeat(depth + 1), encodeText(child._text), newline);
          }
        } else if (isXmlNode(child)) {
          parts.push(serializeNode(child, opts, depth + 1), newline);
        }
      }
      parts.push(indent);
    }
  } else if (hasCdata) {
    // CDATA section
    parts.push('<![CDATA[', node._cdata!, ']]>');
    if (hasText) {
      parts.push(encodeText(node._text!));
    }
  } else if (hasText) {
    // Text content only
    parts.push(encodeText(node._text!));
  }

  // Closing tag
  parts.push('</', node._name, '>');

  return parts.join('');
}

/**
 * Encode text content for XML
 */
function encodeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Encode attribute value for XML
 */
function encodeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
