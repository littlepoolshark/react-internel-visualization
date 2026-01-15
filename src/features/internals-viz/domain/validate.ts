import type { GraphNode, GraphEdge } from './types';

/**
 * Validate a graph according to contracts/graph-schema.md rules.
 * Returns an array of error messages; empty = valid.
 */
export function validateGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): string[] {
  const errors: string[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // 1. Check node id uniqueness
  const seenIds = new Set<string>();
  for (const n of nodes) {
    if (seenIds.has(n.id)) {
      errors.push(`Duplicate node id: ${n.id}`);
    }
    seenIds.add(n.id);
  }

  // 2. Validate edges
  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.sourceNodeId);
    if (!sourceNode) {
      errors.push(`Edge ${edge.id}: source node ${edge.sourceNodeId} not found`);
      continue;
    }

    const targetNode = nodeMap.get(edge.targetNodeId);
    if (!targetNode) {
      errors.push(`Edge ${edge.id}: target node ${edge.targetNodeId} not found`);
      continue;
    }

    if (edge.type === 'field-value') {
      // sourceAnchorId must exist on source node
      if (!edge.sourceAnchorId) {
        errors.push(`Edge ${edge.id}: field-value edge missing sourceAnchorId`);
      } else {
        const anchorExists = sourceNode.attributes.some(
          (a) => a.sourceAnchorId === edge.sourceAnchorId,
        );
        if (!anchorExists) {
          errors.push(
            `Edge ${edge.id}: sourceAnchorId "${edge.sourceAnchorId}" not found on source node`,
          );
        }
      }

      // target must be value node
      if (targetNode.type !== 'value') {
        errors.push(
          `Edge ${edge.id}: field-value edge target must be value node, got ${targetNode.type}`,
        );
      }

      // targetAnchor must be 'node-header'
      if (edge.targetAnchor !== 'node-header') {
        errors.push(
          `Edge ${edge.id}: field-value edge targetAnchor must be 'node-header'`,
        );
      }
    }
  }

  return errors;
}

