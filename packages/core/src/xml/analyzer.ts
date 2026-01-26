/**
 * XML structure analyzer for AXON
 * Analyzes XML to recommend optimal encoding mode
 */

import type {
  XmlNode,
  XmlAnalysisResult,
  XmlCharacteristics,
  XmlEncodingMode,
} from './types';
import { isXmlNode, isXmlTextNode } from './types';
import { parseXmlElement } from './parser';

/**
 * Analyze XML string and recommend encoding mode
 */
export function analyzeXml(input: string | XmlNode): XmlAnalysisResult {
  const node = typeof input === 'string' ? parseXmlElement(input) : input;

  const characteristics = analyzeNode(node);

  const { mode, reason, reduction } = selectMode(characteristics);

  return {
    recommendedMode: mode,
    reason,
    characteristics,
    estimatedReduction: reduction,
  };
}

/**
 * Analyze XML node structure
 */
function analyzeNode(node: XmlNode, depth: number = 0): XmlCharacteristics {
  const result: XmlCharacteristics = {
    elementCount: 1,
    maxDepth: depth,
    hasMixedContent: false,
    hasCdata: false,
    hasNamespaces: false,
    hasAttributes: false,
    hasUniformChildren: false,
    avgChildrenPerElement: 0,
    uniqueElementNames: new Set([node._name]),
  };

  // Check attributes
  if (node._attrs && Object.keys(node._attrs).length > 0) {
    result.hasAttributes = true;
  }

  // Check namespaces
  if (node._ns && Object.keys(node._ns).length > 0) {
    result.hasNamespaces = true;
  }

  // Check CDATA
  if (node._cdata !== undefined) {
    result.hasCdata = true;
  }

  // Analyze children
  if (node._children && node._children.length > 0) {
    const elementChildren = node._children.filter(isXmlNode);
    const textChildren = node._children.filter(
      (c) => isXmlTextNode(c) && c._text.trim() !== ''
    );

    // Check for mixed content
    if (elementChildren.length > 0 && textChildren.length > 0) {
      result.hasMixedContent = true;
    }

    // Analyze element children
    let totalChildren = elementChildren.length;

    for (const child of elementChildren) {
      const childResult = analyzeNode(child, depth + 1);

      result.elementCount += childResult.elementCount;
      result.maxDepth = Math.max(result.maxDepth, childResult.maxDepth);
      result.hasMixedContent = result.hasMixedContent || childResult.hasMixedContent;
      result.hasCdata = result.hasCdata || childResult.hasCdata;
      result.hasNamespaces = result.hasNamespaces || childResult.hasNamespaces;
      result.hasAttributes = result.hasAttributes || childResult.hasAttributes;

      for (const name of childResult.uniqueElementNames) {
        result.uniqueElementNames.add(name);
      }

      totalChildren += childResult.avgChildrenPerElement * childResult.elementCount;
    }

    result.avgChildrenPerElement = totalChildren / result.elementCount;

    // Check for uniform children
    if (elementChildren.length >= 2) {
      result.hasUniformChildren = checkUniformity(elementChildren);
    }
  }

  return result;
}

/**
 * Check if children have uniform structure
 */
function checkUniformity(children: XmlNode[]): boolean {
  if (children.length < 2) return false;

  const firstChild = children[0];
  if (!firstChild) return false;

  const firstName = firstChild._name;
  const firstStructure = getStructureSignature(firstChild);

  let uniformCount = 0;

  for (const child of children) {
    if (child._name === firstName) {
      const sig = getStructureSignature(child);
      if (sig === firstStructure) {
        uniformCount++;
      }
    }
  }

  // Consider uniform if >75% of children match
  return uniformCount >= children.length * 0.75;
}

/**
 * Get a signature string representing node structure
 */
function getStructureSignature(node: XmlNode): string {
  const parts: string[] = [node._name];

  if (node._attrs) {
    const attrKeys = Object.keys(node._attrs).sort();
    parts.push(`attrs:${attrKeys.join(',')}`);
  }

  if (node._text !== undefined) parts.push('text');
  if (node._cdata !== undefined) parts.push('cdata');

  if (node._children) {
    const childNames = node._children
      .filter(isXmlNode)
      .map((c) => c._name)
      .sort();
    parts.push(`children:${childNames.join(',')}`);
  }

  return parts.join('|');
}

/**
 * Select encoding mode based on characteristics
 */
function selectMode(chars: XmlCharacteristics): {
  mode: XmlEncodingMode;
  reason: string;
  reduction: number;
} {
  // Mixed content: use xml-mixed mode
  if (chars.hasMixedContent) {
    return {
      mode: 'xml-mixed',
      reason: 'Document contains mixed content (text interleaved with elements)',
      reduction: 25,
    };
  }

  // Uniform children with significant count: use xml-compact mode
  if (chars.hasUniformChildren && chars.elementCount > 10) {
    return {
      mode: 'xml-compact',
      reason: 'Document has uniform repeating children suitable for tabular format',
      reduction: 65,
    };
  }

  // Deep nesting or complex structure: use xml-nested mode
  if (chars.maxDepth > 5 || chars.uniqueElementNames.size > 20) {
    return {
      mode: 'xml-nested',
      reason: 'Document has deep nesting or many unique element types',
      reduction: 45,
    };
  }

  // Simple structure with few elements
  if (chars.elementCount < 10) {
    return {
      mode: 'xml-nested',
      reason: 'Simple document with few elements',
      reduction: 40,
    };
  }

  // Default: xml-nested for general case
  return {
    mode: 'xml-nested',
    reason: 'General-purpose nested encoding',
    reduction: 45,
  };
}

/**
 * Estimate token reduction for XML → AXON conversion
 */
export function estimateTokenReduction(input: string | XmlNode): {
  xmlTokens: number;
  axonTokens: number;
  reduction: number;
} {
  const xmlString = typeof input === 'string' ? input : '';

  // Simple token estimation (rough approximation)
  // XML tokens: count of < > " = / and words
  const xmlTokens = estimateXmlTokens(xmlString);

  // Analyze for AXON estimation
  const analysis = analyzeXml(input);
  const reductionFactor = analysis.estimatedReduction / 100;

  const axonTokens = Math.round(xmlTokens * (1 - reductionFactor));

  return {
    xmlTokens,
    axonTokens,
    reduction: Math.round(reductionFactor * 100),
  };
}

/**
 * Estimate token count for XML string
 */
function estimateXmlTokens(xml: string): number {
  // Rough estimation: count significant tokens
  let tokens = 0;

  // Count tags
  const tagMatches = xml.match(/<\/?[\w:-]+/g);
  if (tagMatches) tokens += tagMatches.length * 2; // tag name + bracket

  // Count attributes
  const attrMatches = xml.match(/[\w:-]+=/g);
  if (attrMatches) tokens += attrMatches.length * 2; // attr name + =

  // Count quoted values
  const quotedMatches = xml.match(/"[^"]*"/g);
  if (quotedMatches) tokens += quotedMatches.length;

  // Count text content (words)
  const textContent = xml.replace(/<[^>]+>/g, ' ');
  const words = textContent.split(/\s+/).filter((w) => w.length > 0);
  tokens += words.length;

  return tokens;
}

/**
 * Get detailed analysis report for XML
 */
export function getXmlAnalysisReport(input: string | XmlNode): string {
  const analysis = analyzeXml(input);
  const chars = analysis.characteristics;

  const lines: string[] = [
    '=== XML Analysis Report ===',
    '',
    `Recommended Mode: ${analysis.recommendedMode}`,
    `Reason: ${analysis.reason}`,
    `Estimated Token Reduction: ${analysis.estimatedReduction}%`,
    '',
    '--- Structure Characteristics ---',
    `Total Elements: ${chars.elementCount}`,
    `Maximum Depth: ${chars.maxDepth}`,
    `Unique Element Names: ${chars.uniqueElementNames.size}`,
    `Average Children per Element: ${chars.avgChildrenPerElement.toFixed(2)}`,
    '',
    '--- Content Types ---',
    `Has Mixed Content: ${chars.hasMixedContent}`,
    `Has CDATA Sections: ${chars.hasCdata}`,
    `Has Namespaces: ${chars.hasNamespaces}`,
    `Has Attributes: ${chars.hasAttributes}`,
    `Has Uniform Children: ${chars.hasUniformChildren}`,
    '',
    '--- Element Names ---',
    [...chars.uniqueElementNames].join(', '),
  ];

  return lines.join('\n');
}
