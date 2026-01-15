import { describe, it, expect } from 'vitest';
import { buildGraph } from '../../src/features/internals-viz/parser/buildGraph';
import type { HookCall } from '../../src/features/internals-viz/domain/types';

describe('buildGraph – basic', () => {
  it('produces fiber, hook, and value nodes for useState', () => {
    const hooks: HookCall[] = [
      { hookType: 'useState', id: 'hook-0', index: 0, initialValue: '0', isEffect: false },
    ];
    const { nodes, edges } = buildGraph(hooks);

    // fiber node
    expect(nodes.find((n) => n.type === 'fiber')).toBeDefined();
    // hook node
    expect(nodes.find((n) => n.type === 'hook' && n.id === 'hook-0')).toBeDefined();
    // value node for initialValue
    expect(nodes.find((n) => n.type === 'value')).toBeDefined();
    // edge from fiber to hook
    expect(edges.find((e) => e.sourceNodeId === 'fiber' && e.targetNodeId === 'hook-0')).toBeDefined();
    // edge from hook to value (field-value)
    const fvEdge = edges.find((e) => e.type === 'field-value');
    expect(fvEdge).toBeDefined();
    expect(fvEdge!.targetAnchor).toBe('node-header');
  });

  it('produces effect node for useEffect', () => {
    const hooks: HookCall[] = [
      { hookType: 'useEffect', id: 'hook-0', index: 0, isEffect: true },
    ];
    const { nodes, edges } = buildGraph(hooks);

    expect(nodes.find((n) => n.type === 'effect')).toBeDefined();
    expect(edges.find((e) => e.targetNodeId === 'effect-0')).toBeDefined();
  });
});

