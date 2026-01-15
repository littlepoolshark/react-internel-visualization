import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ObjectNode from '../components/ObjectNode';
import ValueNode from '../components/ValueNode';
import type { ObjectNodeData } from './toReactFlow';

const nodeTypes = {
  objectNode: ObjectNode,
  valueNode: ValueNode,
};

interface Props {
  nodes: Node<ObjectNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

/**
 * ReactFlow canvas with custom object nodes.
 * FR-005a: Free layout - nodes draggable via onNodesChange.
 * US2: Pan/zoom/drag interactions configured for usability.
 */
export default function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: Props) {
  return (
    <div data-testid="graph-canvas" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        // US2: Interaction options
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.1}
        maxZoom={2}
        // Prevent accidental node connection
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

