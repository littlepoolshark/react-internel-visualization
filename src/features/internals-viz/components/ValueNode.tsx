import { Handle, Position } from 'reactflow';
import type { ObjectNodeData } from '../ui/toReactFlow';

interface Props {
  data: ObjectNodeData;
}

/**
 * Circle-shaped node for primitive values (number/string/boolean/null/undefined).
 * Per FR-008b: primitive value nodes use circle shape.
 * - Top handle: for vertical connection from hook's memoizedState
 * - Left handle: for horizontal connection from hook's next field
 */
export default function ValueNode({ data }: Props) {
  const size = 60;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#eb2f96',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      {data.title}

      {/* Target handle on top (for hook's memoizedState vertical connection) */}
      <Handle
        type="target"
        position={Position.Top}
        id="header"
        style={{
          background: '#eb2f96',
          width: 10,
          height: 10,
          top: -5,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Target handle on left (for hook's next horizontal connection) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#eb2f96',
          width: 10,
          height: 10,
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
}

