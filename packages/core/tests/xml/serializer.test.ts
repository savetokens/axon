import { describe, it, expect } from 'vitest';
import { serializeXml, serializeXmlNode } from '../../src/xml/serializer';
import type { XmlNode, XmlDocument } from '../../src/xml/types';

describe('XML Serializer', () => {
  describe('serializeXmlNode', () => {
    it('serializes a simple element', () => {
      const node: XmlNode = { _name: 'user', _text: 'Alice' };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<user>Alice</user>');
    });

    it('serializes element with attributes', () => {
      const node: XmlNode = {
        _name: 'user',
        _attrs: { id: '1', role: 'admin' },
        _text: 'Alice',
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<user id="1" role="admin">Alice</user>');
    });

    it('serializes self-closing element', () => {
      const node: XmlNode = { _name: 'br' };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<br/>');
    });

    it('serializes nested elements', () => {
      const node: XmlNode = {
        _name: 'user',
        _children: [
          { _name: 'name', _text: 'Alice' },
          { _name: 'email', _text: 'alice@example.com' },
        ],
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<user><name>Alice</name><email>alice@example.com</email></user>');
    });

    it('serializes with pretty printing', () => {
      const node: XmlNode = {
        _name: 'user',
        _children: [
          { _name: 'name', _text: 'Alice' },
        ],
      };
      const xml = serializeXmlNode(node);
      expect(xml).toContain('\n');
      expect(xml).toContain('  <name>');
    });

    it('serializes namespace declarations', () => {
      const node: XmlNode = {
        _name: 'root',
        _ns: { '': 'http://example.com', 'custom': 'http://custom.com' },
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toContain('xmlns="http://example.com"');
      expect(xml).toContain('xmlns:custom="http://custom.com"');
    });

    it('serializes CDATA sections', () => {
      const node: XmlNode = {
        _name: 'script',
        _cdata: 'function foo() { return x < y; }',
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<script><![CDATA[function foo() { return x < y; }]]></script>');
    });

    it('encodes special characters in text', () => {
      const node: XmlNode = { _name: 'text', _text: '<hello> & "world"' };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<text>&lt;hello&gt; &amp; "world"</text>');
    });

    it('encodes special characters in attributes', () => {
      const node: XmlNode = {
        _name: 'el',
        _attrs: { value: 'a < b & c > d "quoted"' },
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toContain('value="a &lt; b &amp; c &gt; d &quot;quoted&quot;"');
    });

    it('handles mixed content', () => {
      const node: XmlNode = {
        _name: 'p',
        _children: [
          { _text: 'Hello ' },
          { _name: 'strong', _text: 'world' },
          { _text: '!' },
        ],
      };
      const xml = serializeXmlNode(node, { pretty: false });
      expect(xml).toBe('<p>Hello <strong>world</strong>!</p>');
    });

    it('respects selfClose option', () => {
      const node: XmlNode = { _name: 'br' };
      const withSelfClose = serializeXmlNode(node, { selfClose: true, pretty: false });
      const withoutSelfClose = serializeXmlNode(node, { selfClose: false, pretty: false });
      expect(withSelfClose).toBe('<br/>');
      expect(withoutSelfClose).toBe('<br></br>');
    });
  });

  describe('serializeXml (document)', () => {
    it('includes XML declaration', () => {
      const doc: XmlDocument = {
        version: '1.0',
        root: { _name: 'root' },
      };
      const xml = serializeXml(doc, { pretty: false });
      expect(xml).toContain('<?xml version="1.0"?>');
    });

    it('includes encoding in declaration', () => {
      const doc: XmlDocument = {
        version: '1.0',
        encoding: 'UTF-8',
        root: { _name: 'root' },
      };
      const xml = serializeXml(doc, { pretty: false });
      expect(xml).toContain('encoding="UTF-8"');
    });

    it('includes standalone in declaration', () => {
      const doc: XmlDocument = {
        version: '1.0',
        standalone: 'yes',
        root: { _name: 'root' },
      };
      const xml = serializeXml(doc, { pretty: false });
      expect(xml).toContain('standalone="yes"');
    });

    it('includes DOCTYPE', () => {
      const doc: XmlDocument = {
        doctype: {
          name: 'html',
          publicId: '-//W3C//DTD XHTML 1.0//EN',
          systemId: 'xhtml.dtd',
        },
        root: { _name: 'html' },
      };
      const xml = serializeXml(doc, { declaration: false, pretty: false });
      expect(xml).toContain('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0//EN" "xhtml.dtd">');
    });

    it('skips declaration when option set', () => {
      const doc: XmlDocument = {
        version: '1.0',
        root: { _name: 'root' },
      };
      const xml = serializeXml(doc, { declaration: false, pretty: false });
      expect(xml).not.toContain('<?xml');
      expect(xml).toBe('<root/>');
    });
  });
});
