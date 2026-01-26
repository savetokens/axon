/**
 * XML ↔ JavaScript Object converter for AXON
 * Converts between XmlNode trees and JS objects for AXON encoding/decoding
 */

import type { XmlNode, XmlDocument, XmlChildNode, XmlConvertOptions } from './types';
import { isXmlNode, isXmlTextNode } from './types';
import { parseXml, parseXmlElement } from './parser';
import { serializeXml } from './serializer';
import { encode } from '../encoder';
import { decode } from '../decoder';
import { AXONXmlConversionError } from './errors';

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: Required<XmlConvertOptions> = {
  mode: 'xml-auto',
  includeDeclaration: true,
  preserveAttributeOrder: false,
  elementMapping: {},
  attributePrefix: 'a_', // Use 'a_' prefix for AXON identifier compatibility
};

/**
 * Convert XML string to AXON string
 */
export function xmlToAxon(xmlString: string, options?: XmlConvertOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Parse XML to node tree
  const doc = parseXml(xmlString);

  // Convert to JS object
  const obj = xmlNodeToObject(doc.root, opts);

  // Wrap with metadata for round-trip
  // Note: Using _xml prefix for AXON identifier compatibility
  const axonObj = {
    _xml: true,
    _version: doc.version || '1.0',
    _encoding: doc.encoding,
    root: obj,
  };

  // Encode to AXON
  return encode(axonObj, { mode: 'nested' });
}

/**
 * Convert AXON string back to XML string
 */
export function axonToXml(axonString: string, options?: XmlConvertOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Decode AXON
  const obj = decode(axonString);

  // Check for XML metadata wrapper
  let rootObj: Record<string, unknown>;
  let version: string | undefined;
  let encoding: string | undefined;

  if (obj && typeof obj === 'object' && '_xml' in obj) {
    const wrapper = obj as Record<string, unknown>;
    version = wrapper._version as string | undefined;
    encoding = wrapper._encoding as string | undefined;
    rootObj = wrapper.root as Record<string, unknown>;
  } else {
    rootObj = obj as Record<string, unknown>;
  }

  // Convert to XmlNode
  const node = objectToXmlNode(rootObj, opts);

  // Create document
  const doc: XmlDocument = {
    version: version || '1.0',
    root: node,
  };

  // Add encoding only if defined
  if (encoding !== undefined) {
    doc.encoding = encoding;
  }

  // Serialize to XML
  return serializeXml(doc, { declaration: opts.includeDeclaration });
}

/**
 * Convert XmlNode to JavaScript object
 */
export function xmlNodeToObject(node: XmlNode, options?: XmlConvertOptions): Record<string, unknown> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const attrPrefix = opts.attributePrefix;
  const result: Record<string, unknown> = {};

  // Element name
  result._name = node._name;

  // Namespaces
  if (node._ns && Object.keys(node._ns).length > 0) {
    result._ns = { ...node._ns };
  }

  // Attributes with prefix
  if (node._attrs) {
    for (const [name, value] of Object.entries(node._attrs)) {
      result[attrPrefix + name] = value;
    }
  }

  // Text content
  if (node._text !== undefined) {
    result._text = node._text;
  }

  // CDATA content
  if (node._cdata !== undefined) {
    result._cdata = node._cdata;
  }

  // Children - always use _children array for AXON compatibility
  // The AXON serializer uses JSON.stringify for objects in arrays,
  // so we keep children as individual nested objects instead
  if (node._children && node._children.length > 0) {
    const elementChildren = node._children.filter(isXmlNode);
    const textChildren = node._children.filter(
      (c) => isXmlTextNode(c) && c._text.trim() !== ''
    );

    const hasMixedContent = elementChildren.length > 0 && textChildren.length > 0;

    if (hasMixedContent) {
      // Mixed content: preserve order with _children array
      result._children = node._children.map((child) => {
        if (isXmlTextNode(child)) {
          return { _text: child._text };
        }
        return xmlNodeToObject(child, opts);
      });
    } else if (elementChildren.length > 0) {
      // Element-only content: use named properties for each child
      // This avoids arrays which cause JSON.stringify issues
      for (const child of elementChildren) {
        const childObj = xmlNodeToObject(child, opts);
        const childName = child._name;

        // If there's already a property with this name, use _children instead
        if (childName in result) {
          // Convert to _children array
          if (!result._children) {
            const existing = result[childName] as Record<string, unknown>;
            result._children = [existing];
            delete result[childName];
          }
          (result._children as unknown[]).push(childObj);
        } else {
          result[childName] = childObj;
        }
      }
    }
  }

  return result;
}

/**
 * Convert JavaScript object back to XmlNode
 */
export function objectToXmlNode(obj: Record<string, unknown>, options?: XmlConvertOptions): XmlNode {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const attrPrefix = opts.attributePrefix;

  // Get element name
  const name = obj._name as string;
  if (!name) {
    throw new AXONXmlConversionError('Object must have _name property');
  }

  const node: XmlNode = { _name: name };

  // Namespaces
  if (obj._ns && typeof obj._ns === 'object') {
    node._ns = obj._ns as Record<string, string>;
  }

  // Attributes (prefixed with @)
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith(attrPrefix) && !key.startsWith('_')) {
      const attrName = key.slice(attrPrefix.length);
      attrs[attrName] = String(value);
    }
  }
  if (Object.keys(attrs).length > 0) {
    node._attrs = attrs;
  }

  // Text content
  if (obj._text !== undefined) {
    node._text = String(obj._text);
  }

  // CDATA content
  if (obj._cdata !== undefined) {
    node._cdata = String(obj._cdata);
  }

  // Children
  if (Array.isArray(obj._children)) {
    node._children = obj._children.map((child) => {
      if (typeof child === 'object' && child !== null) {
        if ('_text' in child && !('_name' in child)) {
          return { _text: String((child as { _text: unknown })._text) };
        }
        return objectToXmlNode(child as Record<string, unknown>, opts);
      }
      throw new AXONXmlConversionError('Invalid child node');
    });
  } else {
    // Look for named child arrays or objects
    const children: XmlChildNode[] = [];

    for (const [key, value] of Object.entries(obj)) {
      // Skip special properties and attributes
      if (key.startsWith('_') || key.startsWith(attrPrefix) || key.startsWith(':')) {
        continue;
      }

      if (Array.isArray(value)) {
        // Array of child elements
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            children.push(objectToXmlNode(item as Record<string, unknown>, opts));
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Single child element
        children.push(objectToXmlNode(value as Record<string, unknown>, opts));
      }
    }

    if (children.length > 0) {
      node._children = children;
    }
  }

  return node;
}

/**
 * Convert XML string directly to JavaScript object (convenience function)
 */
export function parseXmlToObject(xmlString: string, options?: XmlConvertOptions): Record<string, unknown> {
  const node = parseXmlElement(xmlString);
  return xmlNodeToObject(node, options);
}

/**
 * Convert JavaScript object directly to XML string (convenience function)
 */
export function objectToXmlString(obj: Record<string, unknown>, options?: XmlConvertOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const node = objectToXmlNode(obj, opts);
  const doc: XmlDocument = {
    version: '1.0',
    root: node,
  };
  return serializeXml(doc, { declaration: opts.includeDeclaration });
}
