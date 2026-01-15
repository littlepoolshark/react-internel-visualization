/**
 * Stable ID generation utilities.
 * IDs are deterministic based on input, never random/uuid.
 */

/**
 * Create a fiber node id (always "fiber" for single-component input).
 */
export function fiberId(): string {
  return 'fiber';
}

/**
 * Create an updateQueue node id (always "updateQueue" for single-component input).
 */
export function updateQueueId(): string {
  return 'updateQueue';
}

/**
 * Create a hook node id based on index.
 */
export function hookId(index: number): string {
  return `hook-${index}`;
}

/**
 * Create an effect node id based on hook index.
 */
export function effectId(hookIndex: number): string {
  return `effect-${hookIndex}`;
}

/**
 * Create a value node id.
 * @param parentNodeId - id of the node owning the attribute
 * @param fieldKey - attribute key
 */
export function valueId(parentNodeId: string, fieldKey: string): string {
  return `${parentNodeId}:val:${fieldKey}`;
}

/**
 * Create a unique anchor id for a field row.
 * @param nodeId - id of the owning node
 * @param fieldKey - attribute key
 */
export function fieldAnchorId(nodeId: string, fieldKey: string): string {
  return `${nodeId}:anchor:${fieldKey}`;
}

/**
 * Create an edge id.
 */
export function edgeId(sourceId: string, targetId: string): string {
  return `edge:${sourceId}->${targetId}`;
}

