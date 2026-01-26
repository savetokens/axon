import { describe, it, expect } from 'vitest';
import {
  xmlToAxon,
  axonToXml,
  xmlNodeToObject,
  objectToXmlNode,
  parseXmlToObject,
  objectToXmlString,
} from '../../src/xml/converter';
import { parseXmlElement } from '../../src/xml/parser';
import type { XmlNode } from '../../src/xml/types';
import { decode } from '../../src/decoder';

describe('XML Converter', () => {
  describe('xmlNodeToObject', () => {
    it('converts simple element', () => {
      const node: XmlNode = { _name: 'user', _text: 'Alice' };
      const obj = xmlNodeToObject(node);
      expect(obj._name).toBe('user');
      expect(obj._text).toBe('Alice');
    });

    it('converts element with attributes using prefix', () => {
      const node: XmlNode = {
        _name: 'user',
        _attrs: { id: '1', role: 'admin' },
      };
      const obj = xmlNodeToObject(node);
      expect(obj['a_id']).toBe('1');
      expect(obj['a_role']).toBe('admin');
    });

    it('uses custom attribute prefix', () => {
      const node: XmlNode = {
        _name: 'user',
        _attrs: { id: '1' },
      };
      const obj = xmlNodeToObject(node, { attributePrefix: '_' });
      expect(obj['_id']).toBe('1');
    });

    it('converts nested elements', () => {
      const node: XmlNode = {
        _name: 'user',
        _children: [
          { _name: 'name', _text: 'Alice' },
          { _name: 'email', _text: 'alice@example.com' },
        ],
      };
      const obj = xmlNodeToObject(node);
      expect(obj.name).toBeDefined();
      expect((obj.name as any)._text).toBe('Alice');
    });

    it('handles multiple same-name children with _children array', () => {
      const node: XmlNode = {
        _name: 'users',
        _children: [
          { _name: 'user', _text: 'Alice' },
          { _name: 'user', _text: 'Bob' },
        ],
      };
      const obj = xmlNodeToObject(node);
      // Multiple same-name children are stored in _children array
      expect(Array.isArray(obj._children)).toBe(true);
      expect((obj._children as any[]).length).toBe(2);
    });

    it('preserves namespaces', () => {
      const node: XmlNode = {
        _name: 'root',
        _ns: { '': 'http://example.com' },
      };
      const obj = xmlNodeToObject(node);
      expect(obj._ns).toEqual({ '': 'http://example.com' });
    });

    it('preserves CDATA', () => {
      const node: XmlNode = {
        _name: 'script',
        _cdata: 'console.log("hello")',
      };
      const obj = xmlNodeToObject(node);
      expect(obj._cdata).toBe('console.log("hello")');
    });
  });

  describe('objectToXmlNode', () => {
    it('converts simple object', () => {
      const obj = { _name: 'user', _text: 'Alice' };
      const node = objectToXmlNode(obj);
      expect(node._name).toBe('user');
      expect(node._text).toBe('Alice');
    });

    it('converts attributes from prefixed properties', () => {
      const obj = { _name: 'user', 'a_id': '1', 'a_role': 'admin' };
      const node = objectToXmlNode(obj);
      expect(node._attrs).toEqual({ id: '1', role: 'admin' });
    });

    it('converts child arrays', () => {
      const obj = {
        _name: 'users',
        user: [
          { _name: 'user', _text: 'Alice' },
          { _name: 'user', _text: 'Bob' },
        ],
      };
      const node = objectToXmlNode(obj);
      expect(node._children).toHaveLength(2);
    });

    it('converts _children array', () => {
      const obj = {
        _name: 'mixed',
        _children: [
          { _text: 'Hello ' },
          { _name: 'b', _text: 'world' },
        ],
      };
      const node = objectToXmlNode(obj);
      expect(node._children).toHaveLength(2);
      expect((node._children![0] as any)._text).toBe('Hello ');
    });

    it('throws on missing _name', () => {
      expect(() => objectToXmlNode({ _text: 'oops' })).toThrow();
    });
  });

  describe('xmlToAxon / axonToXml', () => {
    it('round-trips simple XML', () => {
      const original = '<user id="1"><name>Alice</name></user>';
      const axon = xmlToAxon(original);
      const result = axonToXml(axon, { includeDeclaration: false });

      // Verify structure is preserved (formatting may differ)
      expect(result).toContain('<user');
      expect(result).toContain('id="1"');
      expect(result).toContain('<name>Alice</name>');
    });

    it('preserves attributes in round-trip', () => {
      const original = '<element attr1="value1" attr2="value2"/>';
      const axon = xmlToAxon(original);
      const result = axonToXml(axon, { includeDeclaration: false });

      expect(result).toContain('attr1="value1"');
      expect(result).toContain('attr2="value2"');
    });

    it('preserves nested structure', () => {
      const original = '<root><level1><level2>deep</level2></level1></root>';
      const axon = xmlToAxon(original);
      const result = axonToXml(axon, { includeDeclaration: false });

      expect(result).toContain('<root>');
      expect(result).toContain('<level1>');
      expect(result).toContain('<level2>deep</level2>');
    });

    it('AXON includes XML metadata', () => {
      const original = '<?xml version="1.0" encoding="UTF-8"?><root/>';
      const axon = xmlToAxon(original);
      const decoded = decode(axon) as any;

      expect(decoded._xml).toBe(true);
      expect(decoded._version).toBe('1.0');
      expect(decoded._encoding).toBe('UTF-8');
    });
  });

  describe('convenience functions', () => {
    it('parseXmlToObject works', () => {
      const obj = parseXmlToObject('<user id="1">Alice</user>');
      expect(obj._name).toBe('user');
      expect(obj['a_id']).toBe('1');
      expect(obj._text).toBe('Alice');
    });

    it('objectToXmlString works', () => {
      const xml = objectToXmlString({ _name: 'user', _text: 'Alice' }, {
        includeDeclaration: false,
      });
      expect(xml).toContain('<user>Alice</user>');
    });
  });

  describe('complex structures', () => {
    // Note: Round-trip with multiple same-name children (like RSS items)
    // is a known limitation due to AXON serializer using JSON.stringify for
    // objects in arrays. The workaround is to use parseXmlToObject/objectToXmlString
    // directly for complex structures with repeated elements.
    it('handles RSS-like structure (without repeated elements)', () => {
      const xml = `
        <rss version="2.0">
          <channel>
            <title>Feed</title>
            <description>A test feed</description>
          </channel>
        </rss>
      `;
      const axon = xmlToAxon(xml);
      const result = axonToXml(axon, { includeDeclaration: false });

      expect(result).toContain('version="2.0"');
      expect(result).toContain('<title>Feed</title>');
      expect(result).toContain('<description>A test feed</description>');
    });

    it('handles RSS-like structure with parseXmlToObject', () => {
      // For structures with repeated elements, use direct object conversion
      const xml = `
        <rss version="2.0">
          <channel>
            <title>Feed</title>
            <item><title>Article 1</title></item>
            <item><title>Article 2</title></item>
          </channel>
        </rss>
      `;
      const obj = parseXmlToObject(xml);
      expect(obj._name).toBe('rss');
      expect((obj as any).channel._name).toBe('channel');
    });
  });
});
