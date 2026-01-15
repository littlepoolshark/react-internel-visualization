import type { GraphNode, GraphEdge, HookCall, AttributeRow, NodeShape } from '../domain/types';
import {
  fiberId,
  updateQueueId,
  effectId,
  valueId,
  fieldAnchorId,
  edgeId,
} from '../domain/stableId';

export interface BuildGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Primitive types that render as circle nodes */
const PRIMITIVE_KINDS = new Set(['number', 'string', 'boolean', 'null', 'undefined']);

/** Determine shape based on value */
function inferValueShape(value: string): NodeShape {
  // Simple heuristic for MVP
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'circle'; // number
  if (/^(true|false)$/.test(value)) return 'circle'; // boolean
  if (/^(null|undefined)$/.test(value)) return 'circle'; // null/undefined
  if (/^['"`].*['"`]$/.test(value)) return 'circle'; // string literal
  return 'rect';
}

/**
 * Create a placeholder attribute row to represent omitted fields.
 * Placed at the beginning of the attributes list.
 */
function createOmittedFieldsPlaceholder(nodeId: string): AttributeRow {
  return {
    key: '......',
    sourceAnchorId: fieldAnchorId(nodeId, 'omitted'),
    displayValue: '',
  };
}

/**
 * Build the domain graph from collected hooks.
 * Stage 1 (MVP): simplified model — fiber → hook chain → effect/value nodes.
 * NOTE: All hooks (including effect hooks) use memoizedState field per spec.
 * Effect objects form a circular linked list via their `next` field.
 */
export function buildGraph(hooks: HookCall[]): BuildGraphResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Collect effect hooks for circular linked list
  const effectHooks = hooks.filter((h) => h.isEffect);
  const effectNodeIds = effectHooks.map((h) => effectId(h.index));

  // 1. Fiber node
  const fiberNodeId = fiberId();
  const fiberAttrs: AttributeRow[] = [
    createOmittedFieldsPlaceholder(fiberNodeId), // Placeholder for omitted fields
  ];

  // Link to hook chain head
  if (hooks.length > 0) {
    const headHookId = hooks[0].id;
    fiberAttrs.push({
      key: 'memoizedState',
      sourceAnchorId: fieldAnchorId(fiberNodeId, 'memoizedState'),
      displayValue: `→ ${headHookId}`,
      valueNodeId: headHookId,
    });
    edges.push({
      id: edgeId(fiberNodeId, headHookId),
      type: 'object-link',
      sourceNodeId: fiberNodeId,
      sourceAnchorId: fieldAnchorId(fiberNodeId, 'memoizedState'),
      targetNodeId: headHookId,
    });
  }

  // 2. UpdateQueue node (positioned below fiber, links to last effect)
  const updateQueueNodeId = updateQueueId();

  // Add updateQueue attribute to fiber (at the end of attributes)
  fiberAttrs.push({
    key: 'updateQueue',
    sourceAnchorId: fieldAnchorId(fiberNodeId, 'updateQueue'),
    valueNodeId: updateQueueNodeId,
  });
  edges.push({
    id: edgeId(fiberNodeId, updateQueueNodeId),
    type: 'object-link',
    sourceNodeId: fiberNodeId,
    sourceAnchorId: fieldAnchorId(fiberNodeId, 'updateQueue'),
    targetNodeId: updateQueueNodeId,
  });

  nodes.push({
    id: fiberNodeId,
    type: 'fiber',
    title: 'fiber 节点',
    shape: 'rect',
    attributes: fiberAttrs,
  });
  const updateQueueAttrs: AttributeRow[] = [
    createOmittedFieldsPlaceholder(updateQueueNodeId), // Placeholder for omitted fields
  ];

  // lastEffect points to the last effect in the circular linked list
  if (effectNodeIds.length > 0) {
    const lastEffectId = effectNodeIds[effectNodeIds.length - 1];
    updateQueueAttrs.push({
      key: 'lastEffect',
      sourceAnchorId: fieldAnchorId(updateQueueNodeId, 'lastEffect'),
      valueNodeId: lastEffectId,
    });
    edges.push({
      id: edgeId(updateQueueNodeId, lastEffectId),
      type: 'object-link',
      sourceNodeId: updateQueueNodeId,
      sourceAnchorId: fieldAnchorId(updateQueueNodeId, 'lastEffect'),
      targetNodeId: lastEffectId,
    });
  }

  nodes.push({
    id: updateQueueNodeId,
    type: 'updateQueue',
    title: 'updateQueue 对象',
    shape: 'rect',
    attributes: updateQueueAttrs,
  });

  // 3. Hook nodes + chain edges + value/effect nodes
  let effectIndex = 0; // Track position in effect list for circular linking

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    const hookNodeId = hook.id;
    const hookAttrs: AttributeRow[] = [
      createOmittedFieldsPlaceholder(hookNodeId), // Placeholder for omitted fields
    ];

    // next pointer
    const nextHookId = i + 1 < hooks.length ? hooks[i + 1].id : null;
    if (nextHookId) {
      // Points to next hook
      hookAttrs.push({
        key: 'next',
        sourceAnchorId: fieldAnchorId(hookNodeId, 'next'),
        displayValue: `→ ${nextHookId}`,
        valueNodeId: nextHookId,
      });
      edges.push({
        id: edgeId(hookNodeId, nextHookId),
        type: 'object-link',
        sourceNodeId: hookNodeId,
        sourceAnchorId: fieldAnchorId(hookNodeId, 'next'),
        targetNodeId: nextHookId,
      });
    } else {
      // Last hook: next points to null (independent value node)
      const nullNodeId = valueId(hookNodeId, 'next');
      hookAttrs.push({
        key: 'next',
        sourceAnchorId: fieldAnchorId(hookNodeId, 'next'),
        valueNodeId: nullNodeId,
      });
      // Create null value node (circle shape)
      nodes.push({
        id: nullNodeId,
        type: 'value',
        title: 'null',
        shape: 'circle',
        attributes: [],
      });
      // Field→Value edge
      edges.push({
        id: edgeId(hookNodeId, nullNodeId),
        type: 'field-value',
        sourceNodeId: hookNodeId,
        sourceAnchorId: fieldAnchorId(hookNodeId, 'next'),
        targetNodeId: nullNodeId,
        targetAnchor: 'node-header',
      });
    }

    // memoizedState: All hooks (including effect hooks) use this field
    if (hook.isEffect) {
      // Effect hook: memoizedState points to effect object
      const effNodeId = effectId(hook.index);
      hookAttrs.push({
        key: 'memoizedState',
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        displayValue: `→ ${effNodeId}`,
        valueNodeId: effNodeId,
      });

      // Determine next effect in circular linked list
      // Last effect points back to first effect (circular)
      const nextEffectNodeId =
        effectNodeIds.length > 1
          ? effectNodeIds[(effectIndex + 1) % effectNodeIds.length]
          : effNodeId; // Single effect points to itself

      nodes.push({
        id: effNodeId,
        type: 'effect',
        title: 'effect 对象',
        shape: 'rect',
        attributes: [
          createOmittedFieldsPlaceholder(effNodeId), // Placeholder for omitted fields
          {
            key: 'create',
            sourceAnchorId: fieldAnchorId(effNodeId, 'create'),
            displayValue: '() => { ... }',
          },
          {
            key: 'next',
            sourceAnchorId: fieldAnchorId(effNodeId, 'next'),
            valueNodeId: nextEffectNodeId,
          },
        ],
      });

      // Edge: effect → next effect (circular linked list)
      edges.push({
        id: edgeId(effNodeId, nextEffectNodeId),
        type: 'object-link',
        sourceNodeId: effNodeId,
        sourceAnchorId: fieldAnchorId(effNodeId, 'next'),
        targetNodeId: nextEffectNodeId,
      });

      // Edge: hook → effect (memoizedState)
      edges.push({
        id: edgeId(hookNodeId, effNodeId),
        type: 'object-link',
        sourceNodeId: hookNodeId,
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        targetNodeId: effNodeId,
      });

      effectIndex++;
    } else if (hook.initialValue !== undefined) {
      // State hook: memoizedState points to value node
      const valNodeId = valueId(hookNodeId, 'memoizedState');
      const valShape = inferValueShape(hook.initialValue);
      hookAttrs.push({
        key: 'memoizedState',
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        displayValue: hook.initialValue,
        valueNodeId: valNodeId,
      });
      // Value node (circle for primitives)
      nodes.push({
        id: valNodeId,
        type: 'value',
        title: hook.initialValue,
        shape: valShape,
        attributes: [],
      });
      // Field→Value edge
      edges.push({
        id: edgeId(hookNodeId, valNodeId),
        type: 'field-value',
        sourceNodeId: hookNodeId,
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        targetNodeId: valNodeId,
        targetAnchor: 'node-header',
      });
    } else if (hook.hookType === 'useMemo' && hook.memoValue !== undefined) {
      // useMemo hook: memoizedState points to computed value node
      const valNodeId = valueId(hookNodeId, 'memoizedState');
      const valShape = inferValueShape(hook.memoValue);
      hookAttrs.push({
        key: 'memoizedState',
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        displayValue: hook.memoValue,
        valueNodeId: valNodeId,
      });
      // Value node (circle for primitives)
      nodes.push({
        id: valNodeId,
        type: 'value',
        title: hook.memoValue,
        shape: valShape,
        attributes: [],
      });
      // Field→Value edge
      edges.push({
        id: edgeId(hookNodeId, valNodeId),
        type: 'field-value',
        sourceNodeId: hookNodeId,
        sourceAnchorId: fieldAnchorId(hookNodeId, 'memoizedState'),
        targetNodeId: valNodeId,
        targetAnchor: 'node-header',
      });
    }

    nodes.push({
      id: hookNodeId,
      type: 'hook',
      title: `${hook.hookType} hook 对象`,
      shape: 'rect',
      attributes: hookAttrs,
    });
  }

  return { nodes, edges };
}

