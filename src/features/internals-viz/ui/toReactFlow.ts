import type { Node, Edge } from 'reactflow';
import type { GraphNode, GraphEdge } from '../domain/types';
import { computeLayout } from '../domain/layout';

/** Custom node data passed to ObjectNode / ValueNode */
export interface ObjectNodeData {
  title: string;
  nodeType: GraphNode['type'];
  attributes: GraphNode['attributes'];
}

/**
 * Check if target node is a reference type (non-primitive).
 * Reference types: effect, hook, fiber, or value with rect shape.
 * Primitive types: value with circle shape.
 */
function isReferenceType(targetNodeId: string, nodeMap: Map<string, GraphNode>): boolean {
  const targetNode = nodeMap.get(targetNodeId);
  if (!targetNode) return false;
  
  // effect, hook, fiber are always reference types
  if (targetNode.type !== 'value') return true;
  
  // value nodes: circle = primitive, rect = reference
  return targetNode.shape === 'rect';
}

/**
 * Convert domain graph to ReactFlow nodes & edges.
 */
export function toReactFlow(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { rfNodes: Node<ObjectNodeData>[]; rfEdges: Edge[] } {
  const positions = computeLayout(nodes);

  // Build node map for target type lookup
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const rfNodes: Node<ObjectNodeData>[] = nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    // Use valueNode type for circle-shaped nodes (primitive values)
    const rfType = n.shape === 'circle' ? 'valueNode' : 'objectNode';
    return {
      id: n.id,
      type: rfType,
      position: pos,
      data: {
        title: n.title,
        nodeType: n.type,
        attributes: n.attributes,
      },
    };
  });

  const rfEdges: Edge[] = edges.map((e) => {
    // For field-value edges: source handle = sourceAnchorId; target handle = 'header'
    // For object-link edges: sourceHandle = sourceAnchorId if present
    
    // Hook's memoizedState → value/effect uses straight line (vertical from bottom handle)
    const isHookMemoizedStateEdge =
      e.sourceAnchorId?.includes(':anchor:memoizedState') &&
      e.sourceNodeId.startsWith('hook-');

    // Hook's next → null value node uses straight line (horizontal)
    const isHookNextToNullEdge =
      e.sourceAnchorId?.includes(':anchor:next') &&
      e.sourceNodeId.startsWith('hook-') &&
      e.type === 'field-value';

    // Determine edge type
    // - object-link (fiber→hook, hook→hook): default (bezier curve)
    // - hook's memoizedState/next → value/effect: straight
    // - other field-value: smoothstep
    let edgeType: 'default' | 'straight' | 'smoothstep' = 'smoothstep';
    if (isHookMemoizedStateEdge || isHookNextToNullEdge) {
      edgeType = 'straight';
    } else if (e.type === 'object-link') {
      edgeType = 'default'; // bezier curve for fiber→hook, hook→hook
    }

    // Effect's next → next effect (circular linked list)
    const isEffectToEffectEdge =
      e.sourceNodeId.startsWith('effect-') &&
      e.targetNodeId.startsWith('effect-') &&
      e.sourceAnchorId?.includes(':anchor:next');

    // Check if this is a "loop back" edge (last effect → first effect)
    // Loop back: source index >= target index (e.g., effect-2 → effect-1, or effect-0 → effect-0)
    const isEffectLoopBackEdge = isEffectToEffectEdge && (() => {
      const sourceMatch = e.sourceNodeId.match(/^effect-(\d+)$/);
      const targetMatch = e.targetNodeId.match(/^effect-(\d+)$/);
      if (sourceMatch && targetMatch) {
        const sourceIdx = parseInt(sourceMatch[1], 10);
        const targetIdx = parseInt(targetMatch[1], 10);
        return sourceIdx >= targetIdx;
      }
      return false;
    })();

    // For loop back edge, use smoothstep and bottom source handle
    if (isEffectLoopBackEdge) {
      edgeType = 'smoothstep';
    }

    // updateQueue → effect (lastEffect connection)
    const isUpdateQueueToEffectEdge =
      e.sourceNodeId === 'updateQueue' &&
      e.targetNodeId.startsWith('effect-') &&
      e.sourceAnchorId?.includes(':anchor:lastEffect');

    // fiber → updateQueue connection
    const isFiberToUpdateQueueEdge =
      e.sourceNodeId === 'fiber' &&
      e.targetNodeId === 'updateQueue' &&
      e.sourceAnchorId?.includes(':anchor:updateQueue');

    // For updateQueue → effect, use smoothstep and bottom source handle
    if (isUpdateQueueToEffectEdge) {
      edgeType = 'smoothstep';
    }

    // Determine source handle
    let sourceHandle: string | null = e.sourceAnchorId ?? null;
    if (isEffectLoopBackEdge) {
      // Loop back edge: use bottom source handle to route around the node
      sourceHandle = 'next-bottom';
    } else if (isUpdateQueueToEffectEdge) {
      // updateQueue → effect: use bottom source handle to route around
      sourceHandle = 'lastEffect-bottom';
    }

    // Determine target handle based on edge type and target node
    let targetHandle: string | null = null;
    if (isHookMemoizedStateEdge) {
      // Hook's memoizedState: effect uses 'top', value uses 'header' (top)
      targetHandle = e.targetNodeId.startsWith('effect-') ? 'top' : 'header';
    } else if (isHookNextToNullEdge) {
      // Hook's next → null: horizontal connection to left handle
      targetHandle = 'left';
    } else if (isEffectToEffectEdge) {
      // Effect → Effect: target handle on header left side
      targetHandle = 'header';
    } else if (isUpdateQueueToEffectEdge) {
      // updateQueue → effect: target handle on header right side
      targetHandle = 'header-right';
    } else if (isFiberToUpdateQueueEdge) {
      // fiber → updateQueue: target handle on top
      targetHandle = 'top';
    } else if (e.type === 'field-value') {
      targetHandle = 'header';
    }

    // Determine if edge should be dashed (pointing to reference type)
    const isDashed = isReferenceType(e.targetNodeId, nodeMap);

    return {
      id: e.id,
      source: e.sourceNodeId,
      sourceHandle,
      target: e.targetNodeId,
      targetHandle,
      type: edgeType,
      // Animate edges pointing to reference types (dashed edges have flow animation)
      animated: isDashed,
      style: {
        stroke: isHookMemoizedStateEdge || isHookNextToNullEdge || e.type === 'field-value' ? '#52c41a' : '#1890ff',
        strokeWidth: 2,
        strokeDasharray: isDashed ? '5 5' : undefined,
      },
    };
  });

  return { rfNodes, rfEdges };
}

