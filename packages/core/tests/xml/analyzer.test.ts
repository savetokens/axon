import { describe, it, expect } from 'vitest';
import { analyzeXml, estimateTokenReduction, getXmlAnalysisReport } from '../../src/xml/analyzer';

describe('XML Analyzer', () => {
  describe('analyzeXml', () => {
    it('analyzes simple XML', () => {
      const result = analyzeXml('<user><name>Alice</name></user>');
      expect(result.characteristics.elementCount).toBe(2);
      expect(result.characteristics.maxDepth).toBe(1);
      expect(result.characteristics.uniqueElementNames.size).toBe(2);
    });

    it('detects attributes', () => {
      const result = analyzeXml('<user id="1" role="admin"/>');
      expect(result.characteristics.hasAttributes).toBe(true);
    });

    it('detects namespaces', () => {
      const result = analyzeXml('<root xmlns="http://example.com"/>');
      expect(result.characteristics.hasNamespaces).toBe(true);
    });

    it('detects CDATA', () => {
      const result = analyzeXml('<script><![CDATA[code]]></script>');
      expect(result.characteristics.hasCdata).toBe(true);
    });

    it('detects uniform children', () => {
      const xml = `
        <users>
          <user><name>Alice</name></user>
          <user><name>Bob</name></user>
          <user><name>Charlie</name></user>
        </users>
      `;
      const result = analyzeXml(xml);
      expect(result.characteristics.hasUniformChildren).toBe(true);
    });

    it('detects non-uniform children', () => {
      const xml = `
        <root>
          <header>Title</header>
          <content>Body</content>
          <footer>Footer</footer>
        </root>
      `;
      const result = analyzeXml(xml);
      expect(result.characteristics.hasUniformChildren).toBe(false);
    });

    it('detects mixed content', () => {
      const xml = '<p>Hello <strong>world</strong>!</p>';
      const result = analyzeXml(xml);
      expect(result.characteristics.hasMixedContent).toBe(true);
    });

    it('calculates max depth', () => {
      const xml = '<a><b><c><d><e>deep</e></d></c></b></a>';
      const result = analyzeXml(xml);
      expect(result.characteristics.maxDepth).toBe(4);
    });
  });

  describe('mode selection', () => {
    it('recommends xml-compact for uniform children', () => {
      // Create XML with many uniform children
      const items = Array.from({ length: 20 }, (_, i) =>
        `<item id="${i}"><name>Item ${i}</name></item>`
      ).join('');
      const xml = `<items>${items}</items>`;

      const result = analyzeXml(xml);
      expect(result.recommendedMode).toBe('xml-compact');
    });

    it('recommends xml-mixed for mixed content', () => {
      const xml = '<article>Some <b>bold</b> and <i>italic</i> text.</article>';
      const result = analyzeXml(xml);
      expect(result.recommendedMode).toBe('xml-mixed');
    });

    it('recommends xml-nested for complex structures', () => {
      const xml = `
        <config>
          <database>
            <host>localhost</host>
            <port>5432</port>
          </database>
          <cache>
            <enabled>true</enabled>
          </cache>
        </config>
      `;
      const result = analyzeXml(xml);
      expect(result.recommendedMode).toBe('xml-nested');
    });

    it('provides reason for recommendation', () => {
      const result = analyzeXml('<root><child/></root>');
      expect(result.reason).toBeTruthy();
      expect(typeof result.reason).toBe('string');
    });

    it('provides estimated reduction', () => {
      const result = analyzeXml('<root><child/></root>');
      expect(result.estimatedReduction).toBeGreaterThan(0);
      expect(result.estimatedReduction).toBeLessThanOrEqual(100);
    });
  });

  describe('estimateTokenReduction', () => {
    it('estimates token counts', () => {
      const xml = '<user id="1"><name>Alice</name><email>alice@test.com</email></user>';
      const result = estimateTokenReduction(xml);

      expect(result.xmlTokens).toBeGreaterThan(0);
      expect(result.axonTokens).toBeGreaterThan(0);
      expect(result.axonTokens).toBeLessThanOrEqual(result.xmlTokens);
    });

    it('shows reduction for complex XML', () => {
      const items = Array.from({ length: 10 }, (_, i) =>
        `<item id="${i}"><name>Item ${i}</name><value>${i * 10}</value></item>`
      ).join('');
      const xml = `<items>${items}</items>`;

      const result = estimateTokenReduction(xml);
      expect(result.reduction).toBeGreaterThan(0);
    });
  });

  describe('getXmlAnalysisReport', () => {
    it('generates readable report', () => {
      const xml = `
        <root xmlns="http://example.com">
          <items>
            <item id="1">First</item>
            <item id="2">Second</item>
          </items>
        </root>
      `;
      const report = getXmlAnalysisReport(xml);

      expect(report).toContain('XML Analysis Report');
      expect(report).toContain('Recommended Mode');
      expect(report).toContain('Total Elements');
      expect(report).toContain('Maximum Depth');
      expect(report).toContain('Has Namespaces: true');
      expect(report).toContain('Has Attributes: true');
    });

    it('lists unique element names', () => {
      const xml = '<root><child1/><child2/><child3/></root>';
      const report = getXmlAnalysisReport(xml);

      expect(report).toContain('root');
      expect(report).toContain('child1');
      expect(report).toContain('child2');
      expect(report).toContain('child3');
    });
  });

  describe('edge cases', () => {
    it('handles empty root element', () => {
      const result = analyzeXml('<root/>');
      expect(result.characteristics.elementCount).toBe(1);
      expect(result.characteristics.maxDepth).toBe(0);
    });

    it('handles deeply nested XML', () => {
      let xml = '<root>';
      for (let i = 0; i < 10; i++) {
        xml += `<level${i}>`;
      }
      xml += 'deep';
      for (let i = 9; i >= 0; i--) {
        xml += `</level${i}>`;
      }
      xml += '</root>';

      const result = analyzeXml(xml);
      expect(result.characteristics.maxDepth).toBe(10);
    });

    it('handles XML with only text content', () => {
      const result = analyzeXml('<text>Just some text content</text>');
      expect(result.characteristics.elementCount).toBe(1);
      expect(result.characteristics.hasMixedContent).toBe(false);
    });
  });
});
