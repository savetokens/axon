import type { ASTNode, ObjectNode, ArrayNode, PrimitiveNode } from '../types';

/**
 * Build JavaScript object from AST
 */
export class ObjectBuilder {
  /**
   * Build object from AST node
   */
  public build(node: ASTNode): any {
    switch (node.type) {
      case 'object':
        return this.buildObject(node);
      case 'array':
        return this.buildArray(node);
      case 'primitive':
        return this.buildPrimitive(node);
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  /**
   * Build object from ObjectNode
   */
  private buildObject(node: ObjectNode): Record<string, any> {
    const obj: Record<string, any> = {};

    for (const [key, value] of node.fields) {
      obj[key] = this.build(value);
    }

    return obj;
  }

  /**
   * Build array from ArrayNode
   */
  private buildArray(node: ArrayNode): any[] {
    return node.items.map((item) => this.build(item));
  }

  /**
   * Build primitive value
   */
  private buildPrimitive(node: PrimitiveNode): any {
    return node.value;
  }
}

/**
 * Build JavaScript object from AST
 */
export function buildObject(ast: ASTNode): any {
  const builder = new ObjectBuilder();
  return builder.build(ast);
}
