import { describe, it, expect } from 'vitest';
import { parseXml, parseXmlElement } from '../../src/xml/parser';
import { AXONXmlParseError } from '../../src/xml/errors';

describe('XML Parser', () => {
  describe('parseXmlElement', () => {
    it('parses a simple element', () => {
      const node = parseXmlElement('<user>Alice</user>');
      expect(node._name).toBe('user');
      expect(node._text).toBe('Alice');
    });

    it('parses element with attributes', () => {
      const node = parseXmlElement('<user id="1" role="admin">Alice</user>');
      expect(node._name).toBe('user');
      expect(node._attrs).toEqual({ id: '1', role: 'admin' });
      expect(node._text).toBe('Alice');
    });

    it('parses self-closing element', () => {
      const node = parseXmlElement('<br/>');
      expect(node._name).toBe('br');
      expect(node._text).toBeUndefined();
      expect(node._children).toBeUndefined();
    });

    it('parses nested elements', () => {
      const node = parseXmlElement('<user><name>Alice</name><email>alice@example.com</email></user>');
      expect(node._name).toBe('user');
      expect(node._children).toHaveLength(2);
      expect(node._children![0]).toEqual({ _name: 'name', _text: 'Alice' });
      expect(node._children![1]).toEqual({ _name: 'email', _text: 'alice@example.com' });
    });

    it('parses deeply nested elements', () => {
      const node = parseXmlElement('<root><level1><level2><level3>deep</level3></level2></level1></root>');
      expect(node._name).toBe('root');
      expect(node._children![0]._name).toBe('level1');
      const level2 = (node._children![0] as any)._children![0];
      expect(level2._name).toBe('level2');
      expect(level2._children![0]._name).toBe('level3');
      expect(level2._children![0]._text).toBe('deep');
    });

    it('handles namespace declarations', () => {
      const node = parseXmlElement('<root xmlns="http://example.com" xmlns:custom="http://custom.com"/>');
      expect(node._ns).toEqual({
        '': 'http://example.com',
        'custom': 'http://custom.com',
      });
    });

    it('handles CDATA sections', () => {
      const node = parseXmlElement('<script><![CDATA[function foo() { return x < y; }]]></script>');
      expect(node._name).toBe('script');
      expect(node._cdata).toBe('function foo() { return x < y; }');
    });

    it('decodes XML entities', () => {
      const node = parseXmlElement('<text>&lt;hello&gt; &amp; &quot;world&quot;</text>');
      expect(node._text).toBe('<hello> & "world"');
    });

    it('decodes numeric character references', () => {
      const node = parseXmlElement('<text>&#65;&#x42;&#67;</text>');
      expect(node._text).toBe('ABC');
    });

    it('handles empty elements', () => {
      const node = parseXmlElement('<empty></empty>');
      expect(node._name).toBe('empty');
      expect(node._text).toBeUndefined();
    });

    it('handles elements with only whitespace', () => {
      const node = parseXmlElement('<text>   </text>');
      expect(node._text).toBeUndefined(); // Whitespace trimmed by default
    });

    it('preserves whitespace when option set', () => {
      const node = parseXmlElement('<text>   </text>', { preserveWhitespace: true });
      expect(node._text).toBe('   ');
    });
  });

  describe('parseXml (document)', () => {
    it('parses document with XML declaration', () => {
      const doc = parseXml('<?xml version="1.0" encoding="UTF-8"?><root/>');
      expect(doc.version).toBe('1.0');
      expect(doc.encoding).toBe('UTF-8');
      expect(doc.root._name).toBe('root');
    });

    it('parses document with standalone declaration', () => {
      const doc = parseXml('<?xml version="1.0" standalone="yes"?><root/>');
      expect(doc.standalone).toBe('yes');
    });

    it('parses document with DOCTYPE', () => {
      const doc = parseXml('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0//EN" "xhtml.dtd"><html/>');
      expect(doc.doctype?.name).toBe('html');
      expect(doc.doctype?.publicId).toBe('-//W3C//DTD XHTML 1.0//EN');
      expect(doc.doctype?.systemId).toBe('xhtml.dtd');
    });

    it('parses document with processing instructions', () => {
      const doc = parseXml('<?xml-stylesheet href="style.css"?><root/>', {
        preserveProcessingInstructions: true,
      });
      expect(doc.processingInstructions).toHaveLength(1);
      expect(doc.processingInstructions![0].target).toBe('xml-stylesheet');
    });

    it('parses document with comments', () => {
      const doc = parseXml('<!-- This is a comment --><root/>', { preserveComments: true });
      expect(doc.comments).toHaveLength(1);
      expect(doc.comments![0]).toBe(' This is a comment ');
    });
  });

  describe('error handling', () => {
    it('throws on unclosed tag', () => {
      expect(() => parseXmlElement('<user>Alice')).toThrow(AXONXmlParseError);
    });

    it('throws on mismatched tags', () => {
      expect(() => parseXmlElement('<user>Alice</name>')).toThrow(AXONXmlParseError);
    });

    it('throws on invalid attribute syntax', () => {
      expect(() => parseXmlElement('<user id>')).toThrow(AXONXmlParseError);
    });

    it('throws on unclosed attribute value', () => {
      expect(() => parseXmlElement('<user id="1>')).toThrow(AXONXmlParseError);
    });

    it('throws on invalid name start character', () => {
      expect(() => parseXmlElement('<123/>')).toThrow(AXONXmlParseError);
    });

    it('provides line and column in error', () => {
      try {
        parseXml('<?xml version="1.0"?>\n<root>\n  <unclosed>');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AXONXmlParseError);
        const error = e as AXONXmlParseError;
        expect(error.line).toBeGreaterThan(1);
      }
    });
  });

  describe('real-world XML formats', () => {
    it('parses simple RSS-like structure', () => {
      const xml = `
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Article 1</title>
              <link>http://example.com/1</link>
            </item>
            <item>
              <title>Article 2</title>
              <link>http://example.com/2</link>
            </item>
          </channel>
        </rss>
      `;
      const node = parseXmlElement(xml);
      expect(node._name).toBe('rss');
      expect(node._attrs?.version).toBe('2.0');
    });

    it('parses SVG-like structure', () => {
      const xml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <rect x="0" y="0" width="100" height="100" fill="red"/>
          <circle cx="50" cy="50" r="40" fill="blue"/>
        </svg>
      `;
      const node = parseXmlElement(xml);
      expect(node._name).toBe('svg');
      expect(node._ns?.['']).toBe('http://www.w3.org/2000/svg');
      expect(node._children).toHaveLength(2);
    });
  });
});
