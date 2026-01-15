/* ============================================================
 * Domain types — must match data-model.md + contracts/graph-schema.md
 * ============================================================ */

/** Node type */
export type NodeKind = "fiber" | "hook" | "effect" | "value" | "updateQueue";

/** Value kind for primitive / reference values */
export type ValueKind =
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "array"
  | "function"
  | "symbol"
  | "null"
  | "undefined"
  | "unknown";

/** Attribute row for a GraphNode's body */
export interface AttributeRow {
  /** Field name */
  key: string;
  /** Unique anchor id for this row (used by field→value edge source) */
  sourceAnchorId: string;
  /** Display value (inline) if applicable */
  displayValue?: string;
  /** ID of the value node this field links to */
  valueNodeId?: string;
}

/** Node shape */
export type NodeShape = "rect" | "circle";

/** A node in the graph (fiber / hook / effect / value) */
export interface GraphNode {
  id: string;
  type: NodeKind;
  /** Header title */
  title: string;
  /** Node shape: rect (default) or circle (for primitive values) */
  shape: NodeShape;
  /** Attribute table rows */
  attributes: AttributeRow[];
  /** Optional metadata for stage-2 extensions */
  meta?: Record<string, unknown>;
}

/** Edge type */
export type EdgeKind = "object-link" | "field-value";

/** An edge in the graph */
export interface GraphEdge {
  id: string;
  type: EdgeKind;
  sourceNodeId: string;
  /** For field-value edge: row anchor from source node */
  sourceAnchorId?: string;
  targetNodeId: string;
  /** For field-value edge: always 'node-header' */
  targetAnchor?: "node-header";
}

/** Parse result returned by the parser module */
export interface ParseResult {
  status: "success" | "error";
  errorMessage?: string;
  graph?: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  /** Optional diagnostics (e.g. hook list for tests) */
  diagnostics?: Record<string, unknown>;
}

/** Hook info collected during AST traversal */
export interface HookCall {
  /** e.g. 'useState', 'useEffect' */
  hookType: string;
  /** Unique stable id for this hook call */
  id: string;
  /** Index in call order */
  index: number;
  /** Optional initial value snippet (for useState) */
  initialValue?: string;
  /** Is effect hook? */
  isEffect: boolean;
  /** For useMemo: computed memoized value */
  memoValue?: string;
  /** For useMemo: dependency array variable names */
  memoDeps?: string[];
}
