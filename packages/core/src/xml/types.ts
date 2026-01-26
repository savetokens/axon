/**
 * XML-specific type definitions for AXON
 */

/**
 * Represents an XML element node in the tree structure
 * Note: Property names use underscore prefix (_) instead of ($) for AXON compatibility
 */
export interface XmlNode {
  /** Element tag name */
  _name: string;
  /** Element attributes (name → value) */
  _attrs?: Record<string, string>;
  /** Namespace declarations (prefix → URI) */
  _ns?: Record<string, string>;
  /** Text content (for text-only elements) */
  _text?: string;
  /** CDATA content */
  _cdata?: string;
  /** Ordered child nodes (elements and text nodes) */
  _children?: XmlChildNode[];
}

/**
 * Represents a text node within mixed content
 */
export interface XmlTextNode {
  /** Text content */
  _text: string;
}

/**
 * Child node type - can be either an element or a text node
 */
export type XmlChildNode = XmlNode | XmlTextNode;

/**
 * Represents a complete XML document
 */
export interface XmlDocument {
  /** XML declaration version (default: "1.0") */
  version?: string;
  /** Character encoding (default: "UTF-8") */
  encoding?: string;
  /** Standalone declaration */
  standalone?: 'yes' | 'no';
  /** Document type declaration */
  doctype?: XmlDoctype;
  /** Root element */
  root: XmlNode;
  /** Processing instructions */
  processingInstructions?: XmlProcessingInstruction[];
  /** Top-level comments */
  comments?: string[];
}

/**
 * DOCTYPE declaration
 */
export interface XmlDoctype {
  /** Document type name */
  name: string;
  /** Public identifier */
  publicId?: string;
  /** System identifier */
  systemId?: string;
}

/**
 * Processing instruction (e.g., <?xml-stylesheet ...?>)
 */
export interface XmlProcessingInstruction {
  /** Target name */
  target: string;
  /** Instruction data */
  data: string;
}

/**
 * Options for parsing XML
 */
export interface XmlParseOptions {
  /** Preserve whitespace in text content (default: false) */
  preserveWhitespace?: boolean;
  /** Preserve comments (default: false) */
  preserveComments?: boolean;
  /** Preserve CDATA sections vs converting to text (default: true) */
  preserveCdata?: boolean;
  /** Preserve processing instructions (default: false) */
  preserveProcessingInstructions?: boolean;
  /** Normalize namespace prefixes (default: true) */
  normalizeNamespaces?: boolean;
}

/**
 * Options for serializing XML
 */
export interface XmlSerializeOptions {
  /** Indentation string (default: "  ") */
  indent?: string;
  /** Newline string (default: "\n") */
  newline?: string;
  /** Include XML declaration (default: true) */
  declaration?: boolean;
  /** Self-close empty elements (default: true) */
  selfClose?: boolean;
  /** Pretty print output (default: true) */
  pretty?: boolean;
}

/**
 * Options for converting between XML and AXON
 */
export interface XmlConvertOptions {
  /** XML encoding mode */
  mode?: XmlEncodingMode;
  /** Include XML declaration in output (default: true) */
  includeDeclaration?: boolean;
  /** Preserve attribute order (default: false) */
  preserveAttributeOrder?: boolean;
  /** Custom element name mapping */
  elementMapping?: Record<string, string>;
  /** Custom attribute prefix (default: "@") */
  attributePrefix?: string;
}

/**
 * XML encoding modes for AXON output
 */
export type XmlEncodingMode = 'xml-auto' | 'xml-compact' | 'xml-nested' | 'xml-mixed';

/**
 * Result of XML structure analysis
 */
export interface XmlAnalysisResult {
  /** Recommended encoding mode */
  recommendedMode: XmlEncodingMode;
  /** Reason for recommendation */
  reason: string;
  /** Structural characteristics */
  characteristics: XmlCharacteristics;
  /** Estimated token reduction percentage */
  estimatedReduction: number;
}

/**
 * Characteristics of XML structure for mode selection
 */
export interface XmlCharacteristics {
  /** Total element count */
  elementCount: number;
  /** Maximum nesting depth */
  maxDepth: number;
  /** Has mixed content (text + elements) */
  hasMixedContent: boolean;
  /** Has CDATA sections */
  hasCdata: boolean;
  /** Has namespaces */
  hasNamespaces: boolean;
  /** Has attributes */
  hasAttributes: boolean;
  /** Uniform children (same structure repeated) */
  hasUniformChildren: boolean;
  /** Average children per element */
  avgChildrenPerElement: number;
  /** Unique element names */
  uniqueElementNames: Set<string>;
}

/**
 * Type guard to check if a child node is an XmlNode (element)
 */
export function isXmlNode(node: XmlChildNode): node is XmlNode {
  return '_name' in node;
}

/**
 * Type guard to check if a child node is an XmlTextNode
 */
export function isXmlTextNode(node: XmlChildNode): node is XmlTextNode {
  return !('_name' in node) && '_text' in node;
}
