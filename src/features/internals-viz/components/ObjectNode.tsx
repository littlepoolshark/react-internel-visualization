import { Handle, Position } from 'reactflow';
import type { ObjectNodeData } from '../ui/toReactFlow';
import AttributeRow from './AttributeRow';

const TYPE_COLORS: Record<string, string> = {
  fiber: '#1890ff',
  hook: '#52c41a',
  effect: '#faad14',
  value: '#eb2f96',
  updateQueue: '#722ed1', // purple for updateQueue
};

interface Props {
  data: ObjectNodeData;
}

/**
 * Custom ReactFlow node: header + attribute rows.
 * Header has a target handle ("header") for field→value edge endpoints.
 * Hook nodes: memoizedState has a bottom handle for connecting to value nodes below.
 * Effect nodes: have a top handle for receiving hook's memoizedState connection.
 * Fiber/other nodes: memoizedState uses right handle like other attributes.
 */
export default function ObjectNode({ data }: Props) {
  const bgColor = TYPE_COLORS[data.nodeType] ?? '#d9d9d9';
  const isHookNode = data.nodeType === 'hook';
  const isEffectNode = data.nodeType === 'effect';
  const isUpdateQueueNode = data.nodeType === 'updateQueue';

  // Only hook nodes use bottom handle for memoizedState
  const memoizedStateAttr = isHookNode
    ? data.attributes.find((a) => a.key === 'memoizedState')
    : null;

  return (
    <div
      style={{
        background: '#fff',
        border: `2px solid ${bgColor}`,
        borderRadius: 6,
        minWidth: 180,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      {/* Top handle for effect nodes (receives hook's memoizedState connection) */}
      {isEffectNode && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            background: bgColor,
            width: 10,
            height: 10,
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Top handle for updateQueue nodes (receives fiber's updateQueue connection) */}
      {isUpdateQueueNode && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            background: bgColor,
            width: 10,
            height: 10,
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          background: bgColor,
          color: '#fff',
          padding: '6px 10px',
          fontWeight: 600,
          fontSize: 13,
          borderRadius: '4px 4px 0 0',
          position: 'relative',
        }}
      >
        {data.title}

        {/* Target handle on header left side (for other edge endpoints) */}
        <Handle
          type="target"
          position={Position.Left}
          id="header"
          style={{
            background: bgColor,
            width: 10,
            height: 10,
            left: -5,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />

        {/* Target handle on header right side (for updateQueue → effect connection) */}
        {isEffectNode && (
          <Handle
            type="target"
            position={Position.Right}
            id="header-right"
            style={{
              background: bgColor,
              width: 10,
              height: 10,
              right: -5,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        )}
      </div>

      {/* Body: attribute rows */}
      <div>
        {data.attributes.map((attr) => (
          <AttributeRow key={attr.sourceAnchorId} attr={attr} nodeType={data.nodeType} />
        ))}
      </div>

      {/* Bottom handle for hook's memoizedState → value connection */}
      {memoizedStateAttr && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={memoizedStateAttr.sourceAnchorId}
          style={{
            background: '#52c41a',
            width: 10,
            height: 10,
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Bottom source handle for effect's next → first effect (circular loop back) */}
      {isEffectNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="next-bottom"
          style={{
            background: bgColor,
            width: 10,
            height: 10,
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Bottom source handle for updateQueue's lastEffect → effect connection */}
      {isUpdateQueueNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="lastEffect-bottom"
          style={{
            background: bgColor,
            width: 10,
            height: 10,
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}
    </div>
  );
}

