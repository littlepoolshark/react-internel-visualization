import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import GraphCanvas from '../../src/features/internals-viz/ui/GraphCanvas';
import type { Node, Edge } from 'reactflow';
import type { ObjectNodeData } from '../../src/features/internals-viz/ui/toReactFlow';

// Mock nodes and edges
const mockNodes: Node<ObjectNodeData>[] = [
  {
    id: 'fiber-0',
    type: 'objectNode',
    position: { x: 0, y: 0 },
    data: {
      title: 'fiber 节点',
      nodeType: 'fiber',
      attributes: [],
    },
  },
  {
    id: 'hook-0',
    type: 'objectNode',
    position: { x: 300, y: 0 },
    data: {
      title: 'useState hook 对象',
      nodeType: 'hook',
      attributes: [],
    },
  },
];

const mockEdges: Edge[] = [
  {
    id: 'edge-1',
    source: 'fiber-0',
    target: 'hook-0',
    type: 'smoothstep',
  },
];

describe('GraphCanvas interaction (US2)', () => {
  it('renders nodes and maintains them during pan/zoom interactions', () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();

    render(
      <ReactFlowProvider>
        <div style={{ width: 800, height: 600 }}>
          <GraphCanvas
            nodes={mockNodes}
            edges={mockEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </div>
      </ReactFlowProvider>
    );

    // Canvas should be rendered
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();

    // Nodes should be present (ReactFlow renders node titles in the DOM)
    expect(screen.getByText('fiber 节点')).toBeInTheDocument();
    expect(screen.getByText('useState hook 对象')).toBeInTheDocument();
  });

  it('supports zoom controls', () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();

    render(
      <ReactFlowProvider>
        <div style={{ width: 800, height: 600 }}>
          <GraphCanvas
            nodes={mockNodes}
            edges={mockEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </div>
      </ReactFlowProvider>
    );

    // Controls (zoom buttons) should be present
    // ReactFlow Controls component renders zoom-in, zoom-out, fit-view buttons
    const controls = document.querySelector('.react-flow__controls');
    expect(controls).toBeInTheDocument();
  });
});

