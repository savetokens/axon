/**
 * AXON XML Module
 *
 * Provides XML parsing, serialization, and conversion to/from AXON format.
 *
 * Usage:
 * ```typescript
 * import { parseXml, xmlToAxon, axonToXml, analyzeXml } from '@axon/core';
 *
 * // Parse XML to node tree
 * const doc = parseXml('<user id="1"><name>Alice</name></user>');
 *
 * // Convert XML to AXON
 * const axon = xmlToAxon('<users><user>Alice</user><user>Bob</user></users>');
 *
 * // Convert AXON back to XML
 * const xml = axonToXml(axon);
 *
 * // Analyze XML structure
 * const analysis = analyzeXml(xmlString);
 * console.log(analysis.recommendedMode); // 'xml-compact', 'xml-nested', or 'xml-mixed'
 * ```
 */

// Types
export type {
  XmlNode,
  XmlTextNode,
  XmlChildNode,
  XmlDocument,
  XmlDoctype,
  XmlProcessingInstruction,
  XmlParseOptions,
  XmlSerializeOptions,
  XmlConvertOptions,
  XmlEncodingMode,
  XmlAnalysisResult,
  XmlCharacteristics,
} from './types';

// Type guards
export { isXmlNode, isXmlTextNode } from './types';

// Errors
export { AXONXmlParseError, AXONXmlConversionError, AXONXmlStructureError } from './errors';

// Parser
export { parseXml, parseXmlElement } from './parser';

// Serializer
export { serializeXml, serializeXmlNode } from './serializer';

// Converter
export {
  xmlToAxon,
  axonToXml,
  xmlNodeToObject,
  objectToXmlNode,
  parseXmlToObject,
  objectToXmlString,
} from './converter';

// Analyzer
export { analyzeXml, estimateTokenReduction, getXmlAnalysisReport } from './analyzer';
