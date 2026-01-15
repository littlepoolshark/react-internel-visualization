import { Handle, Position } from 'reactflow';
import type { AttributeRow as AttrRowData, NodeKind } from '../domain/types';

interface Props {
  attr: AttrRowData;
  nodeType: NodeKind;
}

/**
 * A single row in the ObjectNode body.
 * Renders a source handle for field→value edge anchoring.
 * FR-006: When valueNodeId exists, do not display any text on the right side.
 * Note: Hook's memoizedState uses bottom handle (rendered by ObjectNode), not right handle.
 */
export default function AttributeRow({ attr, nodeType }: Props) {
  // FR-006: If this row links to another node, don't show display text
  const showValue = !attr.valueNodeId;
  // Only hook node's memoizedState uses bottom handle
  const useBottomHandle = nodeType === 'hook' && attr.key === 'memoizedState';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '2px 6px',
        borderBottom: '1px solid #e8e8e8',
        position: 'relative',
        fontSize: 12,
      }}
    >
      <span style={{ color: '#389e0d', fontWeight: 500 }}>{attr.key}</span>
      {showValue && (
        <span style={{ color: '#595959' }}>{attr.displayValue ?? '—'}</span>
      )}

      {/* Source handle for this field row (skip hook's memoizedState, it uses bottom) */}
      {!useBottomHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id={attr.sourceAnchorId}
          style={{
            background: '#52c41a',
            width: 8,
            height: 8,
            right: -4,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      )}
    </div>
  );
}

