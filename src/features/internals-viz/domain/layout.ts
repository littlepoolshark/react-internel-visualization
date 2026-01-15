import type { GraphNode } from "./types";

export interface Position {
  x: number;
  y: number;
}

// US2: Increased spacing for better visual readability
const NODE_WIDTH = 240;
const NODE_HEIGHT = 160;
const GAP_X = 100; // Increased horizontal gap
const GAP_Y = 80; // Increased vertical gap
const VALUE_NODE_SIZE = 60; // Must match ValueNode component size

/**
 * Extract parent hook ID from value node ID.
 * Value ID format: `${parentNodeId}:val:${fieldKey}`
 */
function getParentHookIdFromValue(valueNodeId: string): string | null {
  const match = valueNodeId.match(/^(.+):val:/);
  return match ? match[1] : null;
}

/**
 * Extract field key from value node ID.
 * Value ID format: `${parentNodeId}:val:${fieldKey}`
 */
function getFieldKeyFromValue(valueNodeId: string): string | null {
  const match = valueNodeId.match(/:val:(.+)$/);
  return match ? match[1] : null;
}

/**
 * Extract parent hook ID from effect node ID.
 * Effect ID format: `effect-${hookIndex}` → parent is `hook-${hookIndex}`
 */
function getParentHookIdFromEffect(effectNodeId: string): string | null {
  const match = effectNodeId.match(/^effect-(\d+)$/);
  return match ? `hook-${match[1]}` : null;
}

/**
 * Compute deterministic initial positions for nodes.
 * Layout: fiber on left → hooks row → memoizedState targets directly below their parent hooks.
 * US2: Improved spacing for readability.
 */
export function computeLayout(nodes: GraphNode[]): Map<string, Position> {
  const positions = new Map<string, Position>();

  const fiber = nodes.find((n) => n.type === "fiber");
  const updateQueue = nodes.find((n) => n.type === "updateQueue");
  const hooks = nodes.filter((n) => n.type === "hook");
  const effects = nodes.filter((n) => n.type === "effect");
  const values = nodes.filter((n) => n.type === "value");

  let x = 0;
  const y = 0;

  // Fiber node — leftmost
  if (fiber) {
    positions.set(fiber.id, { x, y });

    // UpdateQueue node — directly below fiber, centered
    if (updateQueue) {
      positions.set(updateQueue.id, {
        x,
        y: NODE_HEIGHT + GAP_Y + 100,
      });
    }

    x += NODE_WIDTH + GAP_X;
  }

  // Hooks — horizontal chain, store positions for child node alignment
  const hookPositions = new Map<string, Position>();
  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    const pos = { x, y };
    positions.set(hook.id, pos);
    hookPositions.set(hook.id, pos);
    x += NODE_WIDTH + GAP_X;
  }

  // Effects — directly below their parent hook (centered)
  for (const eff of effects) {
    const parentHookId = getParentHookIdFromEffect(eff.id);
    const parentPos = parentHookId ? hookPositions.get(parentHookId) : null;

    if (parentPos) {
      // Center effect node below parent hook
      positions.set(eff.id, {
        x: parentPos.x,
        y: NODE_HEIGHT + GAP_Y,
      });
    } else {
      // Fallback
      positions.set(eff.id, { x, y: NODE_HEIGHT + GAP_Y });
      x += NODE_WIDTH + GAP_X;
    }
  }

  // Values — position depends on field type
  for (const val of values) {
    const parentHookId = getParentHookIdFromValue(val.id);
    const fieldKey = getFieldKeyFromValue(val.id);
    const parentPos = parentHookId ? hookPositions.get(parentHookId) : null;

    if (parentPos) {
      if (fieldKey === "next") {
        // next field (null): place to the right of parent hook (horizontal)
        positions.set(val.id, {
          x: parentPos.x + NODE_WIDTH + GAP_X,
          y: parentPos.y + NODE_HEIGHT / 2 - VALUE_NODE_SIZE / 2, // vertically centered
        });
      } else {
        // memoizedState field: place below parent hook (vertical)
        const centerX = parentPos.x + NODE_WIDTH / 2 - VALUE_NODE_SIZE / 2;
        positions.set(val.id, {
          x: centerX,
          y: NODE_HEIGHT + GAP_Y,
        });
      }
    } else {
      // Fallback
      positions.set(val.id, { x, y: NODE_HEIGHT + GAP_Y });
      x += VALUE_NODE_SIZE + GAP_X / 2;
    }
  }

  return positions;
}
