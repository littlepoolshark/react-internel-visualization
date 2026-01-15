import { describe, it, expect } from 'vitest';
import { validateGraph } from '../../src/features/internals-viz/domain/validate';
import type { GraphNode, GraphEdge } from '../../src/features/internals-viz/domain/types';

describe('validateGraph', () => {
  it('returns no errors for valid graph', () => {
    const nodes: GraphNode[] = [
      {
        id: 'hook-0',
        type: 'hook',
        title: 'useState hook',
        shape: 'rect',
        attributes: [
          { key: 'memoizedState', sourceAnchorId: 'hook-0:anchor:memoizedState' },
        ],
      },
      {
        id: 'hook-0:val:memoizedState',
        type: 'value',
        title: '0',
        shape: 'circle',
        attributes: [],
      },
    ];
    const edges: GraphEdge[] = [
      {
        id: 'edge1',
        type: 'field-value',
        sourceNodeId: 'hook-0',
        sourceAnchorId: 'hook-0:anchor:memoizedState',
        targetNodeId: 'hook-0:val:memoizedState',
        targetAnchor: 'node-header',
      },
    ];
    expect(validateGraph(nodes, edges)).toHaveLength(0);
  });

  it('returns error if field-value edge target is not value node', () => {
    const nodes: GraphNode[] = [
      { id: 'hook-0', type: 'hook', title: 'hook', shape: 'rect', attributes: [{ key: 'x', sourceAnchorId: 'a' }] },
      { id: 'hook-1', type: 'hook', title: 'hook', shape: 'rect', attributes: [] },
    ];
    const edges: GraphEdge[] = [
      {
        id: 'e1',
        type: 'field-value',
        sourceNodeId: 'hook-0',
        sourceAnchorId: 'a',
        targetNodeId: 'hook-1', // wrong: not value
        targetAnchor: 'node-header',
      },
    ];
    const errors = validateGraph(nodes, edges);
    expect(errors.some((e) => e.includes('must be value node'))).toBe(true);
  });

  it('returns error if field-value edge missing targetAnchor', () => {
    const nodes: GraphNode[] = [
      { id: 'hook-0', type: 'hook', title: 'hook', shape: 'rect', attributes: [{ key: 'x', sourceAnchorId: 'a' }] },
      { id: 'v1', type: 'value', title: '0', shape: 'circle', attributes: [] },
    ];
    const edges: GraphEdge[] = [
      {
        id: 'e1',
        type: 'field-value',
        sourceNodeId: 'hook-0',
        sourceAnchorId: 'a',
        targetNodeId: 'v1',
        // targetAnchor missing
      },
    ];
    const errors = validateGraph(nodes, edges);
    expect(errors.some((e) => e.includes("targetAnchor must be 'node-header'"))).toBe(true);
  });
});

