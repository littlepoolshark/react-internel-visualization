import type { Node } from 'reactflow';
import type { ObjectNodeData } from './toReactFlow';

/**
 * Merge new nodes with existing node positions.
 * - Existing nodes keep their current positions (user may have dragged them)
 * - New nodes use their computed layout positions
 * US3: Preserve positions by node id.
 */
export function mergePositions(
  existingNodes: Node<ObjectNodeData>[],
  newNodes: Node<ObjectNodeData>[],
): Node<ObjectNodeData>[] {
  const existingPositions = new Map<string, { x: number; y: number }>();

  for (const node of existingNodes) {
    existingPositions.set(node.id, node.position);
  }

  return newNodes.map((node) => {
    const existingPos = existingPositions.get(node.id);
    if (existingPos) {
      // Preserve existing position
      return { ...node, position: existingPos };
    }
    // Use new computed position
    return node;
  });
}

